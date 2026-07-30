"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, CalendarDays } from "lucide-react";
import {
  getLocalizedMovieOverview,
  getLocalizedMovieTitle,
  type MovieTitleFields,
} from "@/lib/locale";
import { fetchTmdbMovieDetail } from "@/lib/tmdb-movie-upsert";

interface Movie extends MovieTitleFields {
  _id?: string;
  tmdbId?: number;
  poster: string;
  backdrop?: string;
  releaseYear: number;
  imdbRating?: number;
  imdbVotes?: number;
  genres: string[];
  runtime?: number;
}

interface MovieDetailDialogProps {
  movie: Movie | null;
  open: boolean;
  onClose: () => void;
  onMarkWatched?: () => void;
  onRate?: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
}

export function MovieDetailDialog({
  movie,
  open,
  onClose,
  onMarkWatched,
  onRate,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionDisabled,
}: MovieDetailDialogProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tWatchlist = useTranslations("watchlist");
  const tWatched = useTranslations("watched");
  const [fetchedAr, setFetchedAr] = useState<{
    titleAr?: string;
    overviewAr?: string;
  } | null>(null);
  const fetchKey = `${movie?._id ?? ""}:${movie?.tmdbId ?? ""}:${open}`;
  const [activeFetchKey, setActiveFetchKey] = useState(fetchKey);
  if (activeFetchKey !== fetchKey) {
    setActiveFetchKey(fetchKey);
    setFetchedAr(null);
  }

  useEffect(() => {
    if (!open || !movie || locale !== "ar") return;
    if (movie.titleAr && movie.overviewAr) return;
    if (!movie.tmdbId) return;

    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchTmdbMovieDetail(movie.tmdbId!, "ar");
        if (cancelled) return;
        setFetchedAr({
          titleAr:
            !movie.titleAr &&
            detail.title.trim() &&
            detail.title !== movie.title
              ? detail.title
              : undefined,
          overviewAr:
            !movie.overviewAr &&
            detail.overview.trim() &&
            detail.overview !== (movie.overview ?? "")
              ? detail.overview
              : undefined,
        });
      } catch {
        // Keep stored English overview/title if TMDB Arabic fetch fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, movie, locale]);

  if (!movie) return null;

  const localizedMovie = {
    ...movie,
    titleAr: movie.titleAr ?? fetchedAr?.titleAr,
    overviewAr: movie.overviewAr ?? fetchedAr?.overviewAr,
  };

  const displayTitle = getLocalizedMovieTitle(localizedMovie, locale);
  const displayOverview = getLocalizedMovieOverview(localizedMovie, locale);

  const hasBackdrop = movie.backdrop && movie.backdrop !== "/placeholder.jpg";
  const hasPoster = movie.poster && movie.poster !== "/placeholder.jpg";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{displayTitle}</DialogTitle>
        <div className="max-h-[85vh] overflow-y-auto">
          {hasBackdrop && (
            <div className="relative w-full aspect-video bg-muted">
              <Image
                src={movie.backdrop!}
                alt=""
                fill
                className="object-cover"
                sizes="672px"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          )}

          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative shrink-0 w-24 h-36 rounded-lg overflow-hidden bg-muted shadow-md">
                {hasPoster ? (
                  <Image
                    src={movie.poster}
                    alt={displayTitle}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                    {displayTitle}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold leading-tight">{displayTitle}</h2>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {movie.releaseYear}
                  </span>
                  {movie.runtime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {movie.runtime}m
                    </span>
                  )}
                  {movie.imdbRating && (
                    <span className="flex items-center gap-1 bg-yellow-500/10 rounded px-1.5 py-0.5">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-foreground text-xs">
                        {movie.imdbRating.toFixed(1)}
                      </span>
                      {movie.imdbVotes && (
                        <span className="text-[10px]">
                          ({(movie.imdbVotes / 1000).toFixed(0)}k)
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {movie.genres.map((g) => (
                      <Badge key={g} variant="secondary">
                        {g}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {displayOverview && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {displayOverview}
              </p>
            )}

            <div className="flex gap-2 pt-2 border-t border-border">
              {onPrimaryAction && primaryActionLabel && (
                <Button
                  className="flex-1"
                  onClick={onPrimaryAction}
                  disabled={primaryActionDisabled}
                >
                  {primaryActionLabel}
                </Button>
              )}
              {onMarkWatched && (
                <Button className="flex-1" onClick={onMarkWatched}>
                  {tWatchlist("markAsWatched")}
                </Button>
              )}
              {onRate && (
                <Button variant="outline" className="flex-1" onClick={onRate}>
                  {tWatched("rateThis")}
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                {tCommon("close")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
