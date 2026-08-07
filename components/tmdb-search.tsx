"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import Image from "next/image";
import { Plus, Check, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import {
  TMDB_GENRES,
  genreNamesFromIds,
  type TmdbGenre,
} from "@/lib/tmdb-genres";
import { cn } from "@/lib/utils";
import { tmdbLanguageFromLocale } from "@/lib/locale";
import {
  fetchTmdbMovieDetail,
  fetchTmdbMovieUpsertPayload,
  type TmdbMovieDetail,
} from "@/lib/tmdb-movie-upsert";

interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

type TmdbDetail = TmdbMovieDetail;

type PreviewMovie = {
  tmdbId: number;
  title: string;
  poster: string;
  backdrop?: string;
  releaseYear: number;
  imdbRating?: number;
  imdbVotes?: number;
  genres: string[];
  overview: string;
  runtime?: number;
};

const TMDB_IMG = "https://image.tmdb.org/t/p/w342";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";

function detailToPreview(detail: TmdbDetail): PreviewMovie {
  return {
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
  };
}

interface TMDBSearchProps {
  open: boolean;
  onClose: () => void;
  onMovieAdded?: (movieId: Id<"movies">) => void;
  mode?: "watchlist" | "candidate" | "collection";
  nightId?: Id<"movie_nights">;
}

export function TMDBSearch({
  open,
  onClose,
  onMovieAdded,
  mode = "watchlist",
  nightId,
}: TMDBSearchProps) {
  const locale = useLocale();
  const tmdbLanguage = tmdbLanguageFromLocale(locale);
  const t = useTranslations("watchlist");
  const tNights = useTranslations("nights");
  const tCommon = useTranslations("common");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [selectedGenre, setSelectedGenre] = useState<TmdbGenre | null>(null);
  const [shuffleNonce, setShuffleNonce] = useState(0);
  const [preview, setPreview] = useState<PreviewMovie | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const upsertMovie = useMutation(api.movies.upsertMovie);
  const addToWatchlist = useMutation(api.watchlist.addToWatchlist);
  const addCandidate = useMutation(api.nights.addCandidate);

  const trimmedQuery = query.trim();

  // Title search (takes priority over genre browse)
  useEffect(() => {
    if (!open || !trimmedQuery) return;

    setSelectedGenre(null);
    const controller = new AbortController();
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(trimmedQuery)}&language=${encodeURIComponent(tmdbLanguage)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = (await res.json()) as { results?: TmdbMovie[] };
        if (cancelled) return;
        setResults(data.results ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (cancelled) return;
        toast.error(t("toastSearchFailed"));
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, open, tmdbLanguage, t]);

  // Genre top picks when not searching by title
  useEffect(() => {
    if (!open || trimmedQuery || !selectedGenre) return;

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);

    const shuffle = shuffleNonce > 0;
    const url = `/api/tmdb/discover?genreId=${selectedGenre.id}&language=${encodeURIComponent(tmdbLanguage)}${
      shuffle ? "&shuffle=1" : ""
    }`;

    void (async () => {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Discover failed (${res.status})`);
        const data = (await res.json()) as { results?: TmdbMovie[] };
        if (cancelled) return;
        setResults(data.results ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (cancelled) return;
        toast.error(t("toastSuggestionsFailed"));
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, trimmedQuery, selectedGenre, shuffleNonce, tmdbLanguage, t]);

  const visibleResults =
    open && (trimmedQuery || selectedGenre) ? results : [];

  const handleSelectGenre = (genre: TmdbGenre) => {
    setQuery("");
    setShuffleNonce(0);
    setSelectedGenre((prev) => (prev?.id === genre.id ? null : genre));
  };

  const handleShuffle = () => {
    if (!selectedGenre || loading) return;
    setShuffleNonce((n) => n + 1);
  };

  const openPreview = async (tmdbMovie: TmdbMovie) => {
    setPreviewLoading(true);
    try {
      // Prefer list overview immediately; enrich with detail for runtime/genres
      const quick: PreviewMovie = {
        tmdbId: tmdbMovie.id,
        title: tmdbMovie.title,
        poster: tmdbMovie.poster_path
          ? `${TMDB_IMG}${tmdbMovie.poster_path}`
          : "/placeholder.jpg",
        backdrop: tmdbMovie.backdrop_path
          ? `${TMDB_BACKDROP}${tmdbMovie.backdrop_path}`
          : undefined,
        overview: tmdbMovie.overview,
        genres: genreNamesFromIds(tmdbMovie.genre_ids, 8),
        releaseYear: tmdbMovie.release_date
          ? new Date(tmdbMovie.release_date).getFullYear()
          : 0,
        imdbRating: tmdbMovie.vote_average,
        imdbVotes: tmdbMovie.vote_count,
      };
      setPreview(quick);
      setPreviewOpen(true);

      const res = await fetch(
        `/api/tmdb/movie/${tmdbMovie.id}?language=${encodeURIComponent(tmdbLanguage)}`,
      );
      if (!res.ok) return;
      const detail: TmdbDetail = await res.json();
      setPreview(detailToPreview(detail));
    } catch {
      toast.error(t("toastDetailsFailed"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleAdd = useCallback(
    async (tmdbId: number) => {
      setAdding(tmdbId);
      try {
        const upsertArgs = await fetchTmdbMovieUpsertPayload(tmdbId);
        const detail = await fetchTmdbMovieDetail(tmdbId, tmdbLanguage);

        const movieId = await upsertMovie(upsertArgs);

        if (mode === "watchlist") {
          await addToWatchlist({ movieId });
          toast.success(t("toastAddedToWatchlist", { title: detail.title }));
        } else if (mode === "candidate" && nightId) {
          await addCandidate({ nightId, movieId });
          toast.success(t("toastAddedCandidate", { title: detail.title }));
        }

        setAdded((prev) => new Set(prev).add(tmdbId));
        onMovieAdded?.(movieId);
        setPreviewOpen(false);
      } catch {
        toast.error(t("toastAddFailed"));
      } finally {
        setAdding(null);
      }
    },
    [
      upsertMovie,
      addToWatchlist,
      addCandidate,
      mode,
      nightId,
      onMovieAdded,
      tmdbLanguage,
      t,
    ],
  );

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setAdded(new Set());
    setSelectedGenre(null);
    setShuffleNonce(0);
    setLoading(false);
    setPreview(null);
    setPreviewOpen(false);
    onClose();
  };

  const addLabel =
    mode === "watchlist"
      ? t("addToWatchlist")
      : mode === "candidate"
        ? t("addAsCandidate")
        : t("addToCollection");

  const dialogTitle =
    mode === "watchlist"
      ? t("searchDialogTitle")
      : mode === "collection"
        ? t("addToCollection")
        : tNights("searchDialogTitle");

  const showEmptySearch =
    !loading && visibleResults.length === 0 && !!trimmedQuery;
  const showIdleHint =
    !loading && visibleResults.length === 0 && !trimmedQuery && !selectedGenre;
  const showEmptyGenre =
    !loading && !!selectedGenre && !trimmedQuery && visibleResults.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-5 pt-5 pb-4">
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="px-5 pb-3 space-y-3">
            <Input
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />

            {!trimmedQuery && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t("browseByGenreHint")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TMDB_GENRES.map((genre) => {
                    const active = selectedGenre?.id === genre.id;
                    return (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => handleSelectGenre(genre)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        {genre.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
            {selectedGenre && !trimmedQuery && (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("topGenre", { genre: selectedGenre.name })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
                  onClick={handleShuffle}
                  disabled={loading}
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  {t("shuffle")}
                </Button>
              </div>
            )}

            {loading && (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="w-10 h-14 rounded shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {showEmptySearch && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t("noResults")}
              </p>
            )}

            {showIdleHint && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t("idleHint")}
              </p>
            )}

            {showEmptyGenre && (
              <p className="text-center text-sm text-muted-foreground py-8">
                {t("noGenrePicks")}
              </p>
            )}

            {!loading &&
              visibleResults.map((movie) => {
                const isAdded = added.has(movie.id);
                const isAdding = adding === movie.id;
                const year = movie.release_date
                  ? new Date(movie.release_date).getFullYear()
                  : null;
                const genres = genreNamesFromIds(movie.genre_ids);

                return (
                  <div
                    key={movie.id}
                    className="flex items-center gap-3 rounded-lg hover:bg-accent/40 transition-colors p-2"
                  >
                    <button
                      type="button"
                      className="flex flex-1 min-w-0 items-center gap-3 text-start rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => void openPreview(movie)}
                      disabled={previewLoading}
                    >
                      <div className="relative shrink-0 w-10 h-14 rounded overflow-hidden bg-muted">
                        {movie.poster_path ? (
                          <Image
                            src={`${TMDB_IMG}${movie.poster_path}`}
                            alt={movie.title}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" dir="auto">
                          {movie.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {year && (
                            <span className="text-xs text-muted-foreground">
                              {year}
                            </span>
                          )}
                          {movie.vote_average > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-500/10 rounded px-1.5 py-0.5">
                              <span className="text-[10px] font-bold text-yellow-600">
                                {tCommon("imdb")}
                              </span>
                              <span className="text-xs font-semibold">
                                {movie.vote_average.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        {genres.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {genres.map((genre) => (
                              <Badge
                                key={genre}
                                variant="secondary"
                                className="h-4 px-1.5 text-[10px] font-normal"
                              >
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    <Button
                      type="button"
                      size="sm"
                      variant={isAdded ? "secondary" : "default"}
                      className="shrink-0 h-7 w-7 p-0"
                      onClick={() => !isAdded && handleAdd(movie.id)}
                      disabled={isAdding || isAdded}
                    >
                      {isAdded ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : isAdding ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      <MovieDetailDialog
        movie={preview}
        open={previewOpen && !!preview}
        onClose={() => {
          setPreviewOpen(false);
          setPreview(null);
        }}
        primaryActionLabel={
          preview && added.has(preview.tmdbId) ? undefined : addLabel
        }
        onPrimaryAction={
          preview && !added.has(preview.tmdbId)
            ? () => void handleAdd(preview.tmdbId)
            : undefined
        }
        primaryActionDisabled={
          !!preview && (adding === preview.tmdbId || previewLoading)
        }
      />
    </>
  );
}

export { Badge };
