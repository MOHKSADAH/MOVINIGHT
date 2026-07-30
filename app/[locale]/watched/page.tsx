"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { WatchedGridCard } from "@/components/movie-card";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Eye, Search, Plus, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations, useLocale } from "next-intl";
import { getLocalizedMovieTitle, tmdbLanguageFromLocale } from "@/lib/locale";
import { fetchTmdbMovieUpsertPayload } from "@/lib/tmdb-movie-upsert";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const PAGE_SIZE = 12;

type WatchedEntry = {
  _id: Id<"watched_entries">;
  movieId: Id<"movies">;
  watchedAt: number;
  nightId?: Id<"movie_nights">;
  ratings: { userId: Id<"users">; score: number; note?: string }[];
  movie: {
    _id: Id<"movies">;
    title: string;
    poster: string;
    releaseYear: number;
    imdbRating?: number;
    genres: string[];
    overview: string;
    runtime?: number;
  } | null;
};

type TmdbResult = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string;
  vote_average?: number;
};

type TmdbDetail = TmdbResult & {
  overview?: string;
  backdrop_path?: string;
  genres?: { id: number; name: string }[];
  runtime?: number;
};

function getPageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const items: (number | "ellipsis")[] = [0];
  if (current > 2) items.push("ellipsis");
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  for (let i = start; i <= end; i++) items.push(i);
  if (current < total - 3) items.push("ellipsis");
  items.push(total - 1);
  return items;
}

function LogMovieDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("watched");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const tmdbLanguage = tmdbLanguageFromLocale(locale);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TmdbDetail | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [score, setScore] = useState(0);
  const [note, setNote] = useState("");
  const [nightId, setNightId] = useState<string>("none");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const upsertMovie = useMutation(api.movies.upsertMovie);
  const addWatchedEntry = useMutation(api.watched.addWatchedEntry);
  const addRating = useMutation(api.watched.addRating);
  const nights = useQuery(api.nights.getNights);

  const pastNights = nights?.filter((n) => n.status === "done") ?? [];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(query)}&language=${encodeURIComponent(tmdbLanguage)}`,
        );
        const data = await res.json();
        setResults(data.results?.slice(0, 5) ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, tmdbLanguage]);

  const handleSelectMovie = async (result: TmdbResult) => {
    const res = await fetch(
      `/api/tmdb/movie/${result.id}?language=${encodeURIComponent(tmdbLanguage)}`,
    );
    const data = await res.json();
    setSelectedMovie(data);
    setResults([]);
    setQuery("");
  };

  const handleNightSelect = (value: string) => {
    setNightId(value);
    if (value !== "none") {
      const night = nights?.find((n) => n._id === value);
      if (night) setDate(new Date(night.date));
    }
  };

  const handleSubmit = async () => {
    if (!selectedMovie || score === 0) {
      toast.error(t("toastSelectMovieRating"));
      return;
    }
    setSaving(true);
    try {
      const upsertArgs = await fetchTmdbMovieUpsertPayload(selectedMovie.id);
      const movieId = await upsertMovie(upsertArgs);
      const entryId = await addWatchedEntry({
        movieId,
        watchedAt: date ? date.getTime() : Date.now(),
        nightId:
          nightId !== "none"
            ? (nightId as Id<"movie_nights">)
            : undefined,
      });
      await addRating({ entryId, score, note: note || undefined });
      toast.success(t("toastLogged"));
      setSelectedMovie(null);
      setDate(undefined);
      setScore(0);
      setNote("");
      setNightId("none");
      onClose();
    } catch {
      toast.error(t("toastLogFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("logDialogTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!selectedMovie ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="log-movie-search">
                {t("movieLabel")}
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="log-movie-search"
                  placeholder={t("searchForMoviePlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="ps-9"
                  autoFocus
                />
              </div>
              {searching && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  {t("searching")}
                </p>
              )}
              {results.length > 0 && (
                <div className="border border-border rounded-md divide-y divide-border overflow-hidden">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="w-full flex items-center gap-2.5 p-2.5 hover:bg-accent transition-colors text-start"
                      onClick={() => handleSelectMovie(r)}
                    >
                      {r.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w92${r.poster_path}`}
                          alt={r.title}
                          width={32}
                          height={48}
                          className="rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-12 bg-muted rounded shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.release_date?.split("-")[0]}
                          {r.vote_average
                            ? ` · IMDb ${r.vote_average.toFixed(1)}`
                            : ""}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {selectedMovie.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`}
                  alt={selectedMovie.title}
                  width={40}
                  height={60}
                  className="rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedMovie.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedMovie.release_date?.split("-")[0]}
                  {selectedMovie.vote_average
                    ? ` · IMDb ${selectedMovie.vote_average.toFixed(1)}`
                    : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={() => setSelectedMovie(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {pastNights.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="log-movie-night">
                {t("movieNightLabel")}{" "}
                <span className="text-muted-foreground font-normal">
                  {tCommon("optional")}
                </span>
              </label>
              <select
                id="log-movie-night"
                value={nightId}
                onChange={(e) => handleNightSelect(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="none">{t("noMovieNight")}</option>
                {pastNights.map((night) => (
                  <option key={night._id} value={night._id}>
                    {night.title} ·{" "}
                    {new Date(night.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              {t("dateWatchedLabel")}{" "}
              <span className="text-muted-foreground font-normal">
                {tCommon("optional")}
              </span>
            </p>
            <div className="flex justify-center border border-border rounded-md py-2">
              <DayPicker
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={{ after: new Date() }}
              />
            </div>
            {!date && (
              <p className="text-xs text-muted-foreground text-center">
                {t("dateDefaultHint")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("yourRating")}</p>
            <div className="flex justify-center">
              <StarRating value={score} onChange={setScore} size="lg" max={10} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="log-movie-note">
              {tCommon("note")}{" "}
              <span className="text-muted-foreground font-normal">
                {tCommon("optional")}
              </span>
            </label>
            <Input
              id="log-movie-note"
              placeholder={t("notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={saving || !selectedMovie || score === 0}
            >
              {saving ? tCommon("saving") : t("logMovieButton")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RatingDialog({
  entry,
  currentUserId,
  open,
  onClose,
}: {
  entry: WatchedEntry;
  currentUserId: Id<"users"> | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("watched");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const myRating = entry.ratings.find((r) => r.userId === currentUserId);
  const [score, setScore] = useState(myRating?.score ?? 0);
  const [note, setNote] = useState(myRating?.note ?? "");
  const [saving, setSaving] = useState(false);

  const addRating = useMutation(api.watched.addRating);

  const handleSave = async () => {
    if (score === 0) {
      toast.error(t("toastSelectRating"));
      return;
    }
    setSaving(true);
    try {
      await addRating({ entryId: entry._id, score, note: note || undefined });
      toast.success(t("toastRatingSaved"));
      onClose();
    } catch {
      toast.error(t("toastRatingFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t("rateDialogTitle", {
              title: entry.movie
                ? getLocalizedMovieTitle(entry.movie, locale)
                : "",
            })}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex justify-center">
            <StarRating value={score} onChange={setScore} size="lg" max={10} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="rate-entry-note">
              {tCommon("noteOptional")}
            </label>
            <Input
              id="rate-entry-note"
              placeholder={t("notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? tCommon("saving") : t("saveRating")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WatchedPage() {
  const t = useTranslations("watched");
  const tEmpty = useTranslations("empty");
  const tCommon = useTranslations("common");

  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [ratingEntry, setRatingEntry] = useState<WatchedEntry | null>(null);
  const [detailEntry, setDetailEntry] = useState<WatchedEntry | null>(null);

  const user = useQuery(api.users.getCurrentUser);
  const entries = useQuery(api.watched.getWatchedEntries);
  const deleteWatchedEntry = useMutation(api.watched.deleteWatchedEntry);

  const handleDelete = async (entryId: Id<"watched_entries">) => {
    try {
      await deleteWatchedEntry({ entryId });
      toast.success(t("toastDeleted"));
    } catch {
      toast.error(t("toastDeleteFailed"));
    }
  };

  const filtered = entries?.filter((entry) => {
    if (!filter) return true;
    return entry.movie?.title.toLowerCase().includes(filter.toLowerCase());
  });

  const totalPages = Math.ceil((filtered?.length ?? 0) / PAGE_SIZE);
  const paged = filtered?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilterChange = (val: string) => {
    setFilter(val);
    setPage(0);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {entries === undefined
                ? tCommon("loading")
                : tCommon("moviesWatchedCount", { count: entries.length })}
            </p>
          </div>
          <Button onClick={() => setLogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("logMovie")}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="ps-9"
          />
        </div>

        {/* Grid */}
        {entries === undefined ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border overflow-hidden">
                <Skeleton className="aspect-2/3 w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-7 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : paged && paged.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paged.map((entry) => {
                if (!entry.movie) return null;
                const avgRating =
                  entry.ratings.length > 0
                    ? entry.ratings.reduce((s, r) => s + r.score, 0) /
                      entry.ratings.length
                    : undefined;
                const myRating = user
                  ? entry.ratings.find((r) => r.userId === user._id)
                  : undefined;

                return (
                  <WatchedGridCard
                    key={entry._id}
                    movie={entry.movie}
                    watchedAt={entry.watchedAt}
                    avgRating={avgRating}
                    myRating={myRating}
                    ratingCount={entry.ratings.length}
                    onClick={() => setDetailEntry(entry as WatchedEntry)}
                    onDelete={(user as { isOwner?: boolean } | null)?.isOwner
                      ? () => handleDelete(entry._id)
                      : undefined}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className={
                        page === 0
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {getPageItems(page, totalPages).map((item, idx) =>
                    item === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          isActive={page === item}
                          onClick={() => setPage(item)}
                          className="cursor-pointer"
                        >
                          {item + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      className={
                        page >= totalPages - 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : filter ? (
          <EmptyState
            icon={Search}
            title={tEmpty("noSearchMatchTitle")}
            description={tEmpty("noSearchMatchDesc")}
          />
        ) : (
          <EmptyState
            icon={Eye}
            title={tEmpty("watchedEmptyTitle")}
            description={tEmpty("watchedEmptyDesc")}
            actionLabel={tEmpty("logFirstMovieAction")}
            onAction={() => setLogOpen(true)}
          />
        )}
      </div>

      <LogMovieDialog open={logOpen} onClose={() => setLogOpen(false)} />

      {ratingEntry && (
        <RatingDialog
          entry={ratingEntry}
          currentUserId={user?._id}
          open={!!ratingEntry}
          onClose={() => setRatingEntry(null)}
        />
      )}

      <MovieDetailDialog
        movie={detailEntry?.movie ?? null}
        open={!!detailEntry}
        onClose={() => setDetailEntry(null)}
        onRate={() => {
          setRatingEntry(detailEntry);
          setDetailEntry(null);
        }}
      />
    </AppShell>
  );
}
