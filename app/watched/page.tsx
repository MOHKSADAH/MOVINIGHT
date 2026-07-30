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
          `/api/tmdb/search?query=${encodeURIComponent(query)}`,
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
  }, [query]);

  const handleSelectMovie = async (result: TmdbResult) => {
    const res = await fetch(`/api/tmdb/movie/${result.id}`);
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
      toast.error("Please select a movie and a rating");
      return;
    }
    setSaving(true);
    try {
      const movieId = await upsertMovie({
        tmdbId: selectedMovie.id,
        title: selectedMovie.title,
        poster: selectedMovie.poster_path
          ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
          : "/placeholder.jpg",
        backdrop: selectedMovie.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${selectedMovie.backdrop_path}`
          : undefined,
        overview: selectedMovie.overview ?? "",
        genres: selectedMovie.genres?.map((g) => g.name) ?? [],
        runtime: selectedMovie.runtime ?? undefined,
        releaseYear: selectedMovie.release_date
          ? new Date(selectedMovie.release_date).getFullYear()
          : 0,
        imdbRating: selectedMovie.vote_average ?? undefined,
      });
      const entryId = await addWatchedEntry({
        movieId,
        watchedAt: date ? date.getTime() : Date.now(),
        nightId:
          nightId !== "none"
            ? (nightId as Id<"movie_nights">)
            : undefined,
      });
      await addRating({ entryId, score, note: note || undefined });
      toast.success("Movie logged");
      setSelectedMovie(null);
      setDate(undefined);
      setScore(0);
      setNote("");
      setNightId("none");
      onClose();
    } catch {
      toast.error("Failed to log movie");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log a Past Movie</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {!selectedMovie ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="log-movie-search">
                Movie
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="log-movie-search"
                  placeholder="Search for a movie..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              {searching && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  Searching...
                </p>
              )}
              {results.length > 0 && (
                <div className="border border-border rounded-md divide-y divide-border overflow-hidden">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className="w-full flex items-center gap-2.5 p-2.5 hover:bg-accent transition-colors text-left"
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
                Movie Night{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <select
                id="log-movie-night"
                value={nightId}
                onChange={(e) => handleNightSelect(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="none">No movie night</option>
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
              Date Watched{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
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
                No date selected — will use today
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Your Rating</p>
            <div className="flex justify-center">
              <StarRating value={score} onChange={setScore} size="lg" max={10} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="log-movie-note">
              Note{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Input
              id="log-movie-note"
              placeholder="What did you think?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={saving || !selectedMovie || score === 0}
            >
              {saving ? "Saving..." : "Log movie"}
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
  const myRating = entry.ratings.find((r) => r.userId === currentUserId);
  const [score, setScore] = useState(myRating?.score ?? 0);
  const [note, setNote] = useState(myRating?.note ?? "");
  const [saving, setSaving] = useState(false);

  const addRating = useMutation(api.watched.addRating);

  const handleSave = async () => {
    if (score === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSaving(true);
    try {
      await addRating({ entryId: entry._id, score, note: note || undefined });
      toast.success("Rating saved");
      onClose();
    } catch {
      toast.error("Failed to save rating");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate {entry.movie?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex justify-center">
            <StarRating value={score} onChange={setScore} size="lg" max={10} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="rate-entry-note">
              Note (optional)
            </label>
            <Input
              id="rate-entry-note"
              placeholder="What did you think?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WatchedPage() {
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
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete");
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
            <h1 className="text-2xl font-bold tracking-tight">
              Watched History
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {entries === undefined
                ? "Loading..."
                : `${entries.length} movies watched`}
            </p>
          </div>
          <Button onClick={() => setLogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Log movie
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search watched movies..."
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="pl-9"
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
            title="No movies match your search"
            description="Try another title or clear the search box."
          />
        ) : (
          <EmptyState
            icon={Eye}
            title="No movies watched yet"
            description="Log past movies or wrap a Movie Night so they show up in your history."
            actionLabel="Log your first movie"
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
