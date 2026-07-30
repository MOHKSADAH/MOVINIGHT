"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Star, CalendarDays } from "lucide-react";

interface Movie {
  _id?: string;
  title: string;
  poster: string;
  backdrop?: string;
  releaseYear: number;
  imdbRating?: number;
  imdbVotes?: number;
  genres: string[];
  overview: string;
  runtime?: number;
}

interface MovieDetailDialogProps {
  movie: Movie | null;
  open: boolean;
  onClose: () => void;
  onMarkWatched?: () => void;
  onRate?: () => void;
  /** Extra primary action (e.g. Add to watchlist from search preview). */
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
  if (!movie) return null;

  const hasBackdrop = movie.backdrop && movie.backdrop !== "/placeholder.jpg";
  const hasPoster = movie.poster && movie.poster !== "/placeholder.jpg";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{movie.title}</DialogTitle>
        <div className="max-h-[85vh] overflow-y-auto">
          {/* Backdrop */}
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

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Poster + Title */}
            <div className="flex gap-4">
              <div className="relative shrink-0 w-24 h-36 rounded-lg overflow-hidden bg-muted shadow-md">
                {hasPoster ? (
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                    {movie.title}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl font-bold leading-tight">{movie.title}</h2>

                {/* Meta row */}
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

                {/* Genres */}
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

            {/* Overview */}
            {movie.overview && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {movie.overview}
              </p>
            )}

            {/* Actions */}
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
                  Mark as Watched
                </Button>
              )}
              {onRate && (
                <Button variant="outline" className="flex-1" onClick={onRate}>
                  Rate this
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
