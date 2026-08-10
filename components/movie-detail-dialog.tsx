"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Star,
  CalendarDays,
  Clapperboard,
  ExternalLink,
} from "lucide-react";
import {
  getLocalizedMovieOverview,
  getLocalizedMovieTitle,
  type MovieTitleFields,
} from "@/lib/locale";
import {
  fetchTmdbMovieDetail,
  getTmdbDirector,
  getTmdbTopCast,
  getTmdbTrailerUrl,
  type CreditPerson,
} from "@/lib/tmdb-movie-upsert";
import { PersonFilmographyDialog } from "@/components/person-filmography-dialog";

const CAST_PAGE_SIZE = 8;

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

type EnrichedDetail = {
  runtime?: number;
  genres: string[];
  director?: CreditPerson;
  cast: CreditPerson[];
  trailerUrl?: string;
  titleAr?: string;
  overviewAr?: string;
};

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";

function PersonHeadshot({
  name,
  imageUrl,
  sizePx = 44,
}: {
  name: string;
  imageUrl?: string;
  sizePx?: number;
}) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
      style={{ width: sizePx, height: sizePx, minWidth: sizePx, minHeight: sizePx }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={sizePx}
          height={sizePx}
          unoptimized
          className="h-full w-full max-w-none object-cover object-[center_15%]"
          style={{ aspectRatio: "1 / 1" }}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
          {name[0]?.toUpperCase() ?? "?"}
        </div>
      )}
    </div>
  );
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
  const [enriched, setEnriched] = useState<EnrichedDetail | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<CreditPerson | null>(
    null,
  );
  const [personOpen, setPersonOpen] = useState(false);
  const [nestedMovie, setNestedMovie] = useState<Movie | null>(null);
  const [nestedOpen, setNestedOpen] = useState(false);
  const [nestedLoading, setNestedLoading] = useState(false);
  const [castVisible, setCastVisible] = useState(CAST_PAGE_SIZE);
  const mobileCastSentinelRef = useRef<HTMLDivElement | null>(null);
  const desktopCastSentinelRef = useRef<HTMLDivElement | null>(null);
  const castScrollRef = useRef<HTMLDivElement | null>(null);

  const fetchKey = `${movie?._id ?? ""}:${movie?.tmdbId ?? ""}:${open}`;
  const [activeFetchKey, setActiveFetchKey] = useState(fetchKey);
  if (activeFetchKey !== fetchKey) {
    setActiveFetchKey(fetchKey);
    setEnriched(null);
    setCastVisible(CAST_PAGE_SIZE);
  }

  useEffect(() => {
    if (!open || !movie?.tmdbId) return;

    let cancelled = false;
    void (async () => {
      try {
        const [detailEn, detailAr] = await Promise.all([
          fetchTmdbMovieDetail(movie.tmdbId!, "en-US"),
          locale === "ar"
            ? fetchTmdbMovieDetail(movie.tmdbId!, "ar").catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;

        setEnriched({
          runtime: detailEn.runtime ?? undefined,
          genres:
            detailEn.genres.length > 0
              ? detailEn.genres.map((g) => g.name)
              : movie.genres,
          director: getTmdbDirector(detailEn),
          cast: getTmdbTopCast(detailEn),
          trailerUrl: getTmdbTrailerUrl(detailEn),
          titleAr:
            !movie.titleAr &&
            detailAr?.title.trim() &&
            detailAr.title !== movie.title
              ? detailAr.title
              : undefined,
          overviewAr:
            !movie.overviewAr &&
            detailAr?.overview.trim() &&
            detailAr.overview !== movie.overview
              ? detailAr.overview
              : undefined,
        });
      } catch {
        if (!cancelled) setEnriched(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, movie, locale]);

  const cast = enriched?.cast ?? [];

  useEffect(() => {
    if (!open || cast.length === 0 || castVisible >= cast.length) return;

    const onHit: IntersectionObserverCallback = (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      setCastVisible((n) => Math.min(n + CAST_PAGE_SIZE, cast.length));
    };

    let mobileObserver: IntersectionObserver | undefined;
    let desktopObserver: IntersectionObserver | undefined;

    if (mobileCastSentinelRef.current) {
      mobileObserver = new IntersectionObserver(onHit, {
        root: null,
        rootMargin: "120px",
        threshold: 0,
      });
      mobileObserver.observe(mobileCastSentinelRef.current);
    }

    if (desktopCastSentinelRef.current && castScrollRef.current) {
      desktopObserver = new IntersectionObserver(onHit, {
        root: castScrollRef.current,
        rootMargin: "80px",
        threshold: 0,
      });
      desktopObserver.observe(desktopCastSentinelRef.current);
    }

    return () => {
      mobileObserver?.disconnect();
      desktopObserver?.disconnect();
    };
  }, [open, cast.length, castVisible]);

  const openPerson = (person: CreditPerson) => {
    setSelectedPerson(person);
    setPersonOpen(true);
  };

  const openFilmFromPerson = async (tmdbId: number) => {
    setNestedLoading(true);
    try {
      const detail = await fetchTmdbMovieDetail(tmdbId, "en-US");
      setNestedMovie({
        tmdbId: detail.id,
        title: detail.title,
        poster: detail.poster_path
          ? `${TMDB_IMG}${detail.poster_path}`
          : "/placeholder.jpg",
        backdrop: detail.backdrop_path
          ? `${TMDB_BACKDROP}${detail.backdrop_path}`
          : undefined,
        overview: detail.overview,
        genres: detail.genres.map((g) => g.name),
        runtime: detail.runtime ?? undefined,
        releaseYear: detail.release_date
          ? new Date(detail.release_date).getFullYear()
          : 0,
        imdbRating: detail.vote_average,
        imdbVotes: detail.vote_count,
      });
      setPersonOpen(false);
      setSelectedPerson(null);
      setNestedOpen(true);
    } catch {
      // Keep person dialog open if movie fetch fails
    } finally {
      setNestedLoading(false);
    }
  };

  if (!movie) return null;

  const localizedMovie = {
    ...movie,
    titleAr: movie.titleAr ?? enriched?.titleAr,
    overviewAr: movie.overviewAr ?? enriched?.overviewAr,
  };

  const displayTitle = getLocalizedMovieTitle(localizedMovie, locale);
  const displayOverview = getLocalizedMovieOverview(localizedMovie, locale);
  const runtime = enriched?.runtime ?? movie.runtime;
  const genres =
    enriched?.genres && enriched.genres.length > 0
      ? enriched.genres
      : movie.genres;
  const director = enriched?.director;
  const trailerUrl = enriched?.trailerUrl;
  const visibleCast = cast.slice(0, castVisible);
  const hasMoreCast = castVisible < cast.length;

  const hasBackdrop = movie.backdrop && movie.backdrop !== "/placeholder.jpg";
  const hasPoster = movie.poster && movie.poster !== "/placeholder.jpg";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          aria-describedby={undefined}
          className="max-w-2xl overflow-hidden p-0 md:max-w-4xl"
        >
          <DialogTitle className="sr-only">{displayTitle}</DialogTitle>
          <div className="flex max-h-[85vh] flex-col md:h-[min(85vh,900px)] md:flex-row">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
              {hasBackdrop ? (
                <div className="relative aspect-video w-full bg-muted">
                  <Image
                    src={movie.backdrop!}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 672px"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
              ) : null}

              <div className="space-y-4 p-6">
                <div className="flex gap-4">
                  <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-muted shadow-md">
                    {hasPoster ? (
                      <Image
                        src={movie.poster}
                        alt={displayTitle}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
                        {displayTitle}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <h2 className="text-xl font-bold leading-tight">
                      {displayTitle}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {movie.releaseYear}
                      </span>
                      {runtime ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {runtime}m
                        </span>
                      ) : null}
                      {movie.imdbRating ? (
                        <span className="flex items-center gap-1 rounded bg-yellow-500/10 px-1.5 py-0.5">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs font-semibold text-foreground">
                            {movie.imdbRating.toFixed(1)}
                          </span>
                          {movie.imdbVotes ? (
                            <span className="text-[10px]">
                              ({(movie.imdbVotes / 1000).toFixed(0)}k)
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </div>

                    {director ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {tWatchlist("director")}
                        </span>
                        {": "}
                        <button
                          type="button"
                          className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => openPerson(director)}
                        >
                          {director.name}
                        </button>
                      </p>
                    ) : null}

                    {genres.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {genres.map((g) => (
                          <Badge key={g} variant="secondary">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    {trailerUrl ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-1.5"
                      >
                        <a href={trailerUrl} target="_blank" rel="noreferrer">
                          <Clapperboard className="h-3.5 w-3.5" />
                          {tWatchlist("trailer")}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {displayOverview ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {displayOverview}
                  </p>
                ) : null}

                {/* Mobile cast: same invisible pagination, stacked under overview */}
                {cast.length > 0 ? (
                  <div className="space-y-2 border-t border-border pt-4 md:hidden">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {tWatchlist("cast")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {visibleCast.map((member) => (
                        <CastMemberButton
                          key={`${member.id}-${member.character ?? ""}`}
                          member={member}
                          onSelect={openPerson}
                        />
                      ))}
                    </div>
                    {hasMoreCast ? (
                      <div
                        ref={mobileCastSentinelRef}
                        className="h-4 w-full"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                ) : null}

                <div className="flex gap-2 border-t border-border pt-2">
                  {onPrimaryAction && primaryActionLabel ? (
                    <Button
                      className="flex-1"
                      onClick={onPrimaryAction}
                      disabled={primaryActionDisabled}
                    >
                      {primaryActionLabel}
                    </Button>
                  ) : null}
                  {onMarkWatched ? (
                    <Button className="flex-1" onClick={onMarkWatched}>
                      {tWatchlist("markAsWatched")}
                    </Button>
                  ) : null}
                  {onRate ? (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onRate}
                    >
                      {tWatched("rateThis")}
                    </Button>
                  ) : null}
                  <Button variant="ghost" onClick={onClose}>
                    {tCommon("close")}
                  </Button>
                </div>
              </div>
            </div>

            {cast.length > 0 ? (
              <aside className="hidden w-72 shrink-0 flex-col border-s border-border md:flex">
                <div className="border-b border-border px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {tWatchlist("cast")}
                  </p>
                </div>
                <div
                  ref={castScrollRef}
                  className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3"
                >
                  {visibleCast.map((member) => (
                    <CastMemberButton
                      key={`${member.id}-${member.character ?? ""}`}
                      member={member}
                      onSelect={openPerson}
                      stacked
                    />
                  ))}
                  {hasMoreCast ? (
                    <div
                      ref={desktopCastSentinelRef}
                      className="h-6 w-full"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <PersonFilmographyDialog
        person={selectedPerson}
        open={personOpen}
        selectingMovie={nestedLoading}
        onClose={() => {
          setPersonOpen(false);
          setSelectedPerson(null);
        }}
        onSelectMovie={(tmdbId) => {
          void openFilmFromPerson(tmdbId);
        }}
      />

      <MovieDetailDialog
        movie={nestedMovie}
        open={nestedOpen && !!nestedMovie}
        onClose={() => {
          setNestedOpen(false);
          setNestedMovie(null);
        }}
      />
    </>
  );
}

function CastMemberButton({
  member,
  onSelect,
  stacked = false,
}: {
  member: CreditPerson;
  onSelect: (person: CreditPerson) => void;
  stacked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(member)}
      className={
        stacked
          ? "flex w-full items-center gap-2.5 rounded-md border border-border/70 bg-muted/20 p-2 text-start transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          : "flex items-center gap-2.5 rounded-md border border-border/70 bg-muted/20 p-2 text-start transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      }
    >
      <PersonHeadshot name={member.name} imageUrl={member.imageUrl} />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{member.name}</p>
        {member.character ? (
          <p className="truncate text-[10px] text-muted-foreground">
            {member.character}
          </p>
        ) : null}
      </div>
    </button>
  );
}
