"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
} from "nuqs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { WatchlistCard } from "@/components/movie-card";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { TMDBSearch } from "@/components/tmdb-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Film } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { useTranslations } from "next-intl";
import { getLocalizedMovieTitle } from "@/lib/locale";
import { getPageItems } from "@/lib/pagination";
import { useLocale } from "next-intl";

const PAGE_SIZE = 12;

const sortParser = parseAsStringEnum(["votes", "recent"] as const).withDefault(
  "votes",
);

type WatchlistMovie = NonNullable<
  ReturnType<typeof useQuery<typeof api.watchlist.getWatchlist>>
>[number]["movie"];

export default function WatchlistPage() {
  const t = useTranslations("watchlist");
  const tEmpty = useTranslations("empty");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [searchOpen, setSearchOpen] = useState(false);
  const [detailMovie, setDetailMovie] = useState<WatchlistMovie | null>(null);

  const [filter, setFilter] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      history: "replace",
      shallow: true,
      limitUrlUpdates: { method: "debounce", timeMs: 300 },
    }),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    sortParser.withOptions({ history: "replace", shallow: true }),
  );
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({
      history: "replace",
      shallow: true,
      clearOnDefault: true,
    }),
  );

  const user = useQuery(api.users.getCurrentUser);
  const watchlist = useQuery(api.watchlist.getWatchlist);
  const toggleUpvote = useMutation(api.watchlist.toggleUpvote);
  const toggleDownvote = useMutation(api.watchlist.toggleDownvote);
  const removeFromWatchlist = useMutation(api.watchlist.removeFromWatchlist);
  const addWatchedEntry = useMutation(api.watched.addWatchedEntry);

  const handleUpvote = async (entryId: string) => {
    try {
      await toggleUpvote({
        entryId: entryId as Parameters<typeof toggleUpvote>[0]["entryId"],
      });
    } catch {
      toast.error(t("toastUpvoteFailed"));
    }
  };

  const handleDownvote = async (entryId: string) => {
    try {
      await toggleDownvote({
        entryId: entryId as Parameters<typeof toggleDownvote>[0]["entryId"],
      });
    } catch {
      toast.error(t("toastDownvoteFailed"));
    }
  };

  const handleRemove = async (entryId: string) => {
    try {
      await removeFromWatchlist({
        entryId: entryId as Parameters<
          typeof removeFromWatchlist
        >[0]["entryId"],
      });
      toast.success(t("toastRemoved"));
    } catch {
      toast.error(t("toastRemoveFailed"));
    }
  };

  const handleMarkWatched = async () => {
    if (!detailMovie) return;
    try {
      await addWatchedEntry({
        movieId: detailMovie._id as Id<"movies">,
        watchedAt: Date.now(),
      });
      toast.success(t("toastMarkedWatched"));
      setDetailMovie(null);
    } catch {
      toast.error(t("toastMarkWatchedFailed"));
    }
  };

  const filteredList = watchlist
    ?.filter((entry) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      const title = entry.movie
        ? getLocalizedMovieTitle(entry.movie, locale).toLowerCase()
        : "";
      return (
        title.includes(q) ||
        entry.movie?.genres.some((g) => g.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sort === "votes") return b.upvotes.length - a.upvotes.length;
      return b.addedAt - a.addedAt;
    });

  const totalPages = Math.max(
    1,
    Math.ceil((filteredList?.length ?? 0) / PAGE_SIZE),
  );
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageIndex = safePage - 1;
  const pagedList = filteredList?.slice(
    pageIndex * PAGE_SIZE,
    pageIndex * PAGE_SIZE + PAGE_SIZE,
  );

  const handleFilterChange = (val: string) => {
    void setFilter(val || null);
    void setPage(1);
  };

  const handleSortChange = (val: "votes" | "recent") => {
    void setSort(val);
    void setPage(1);
  };

  const goToPage = (nextPage: number) => {
    void setPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  return (
    <AppShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {watchlist === undefined
                ? tCommon("loading")
                : tCommon("moviesCount", { count: watchlist.length })}
            </p>
          </div>
          <Button onClick={() => setSearchOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addMovie")}
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("filterPlaceholder")}
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="ps-9"
            />
          </div>
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
            <Button
              variant={sort === "votes" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSortChange("votes")}
            >
              {t("sortTopVoted")}
            </Button>
            <Button
              variant={sort === "recent" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSortChange("recent")}
            >
              {t("sortRecent")}
            </Button>
          </div>
        </div>

        {watchlist === undefined ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border overflow-hidden"
              >
                <Skeleton className="aspect-2/3 w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-7 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : pagedList && pagedList.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pagedList.map((entry) => {
                if (!entry.movie) return null;
                const upvoteIds = new Set(entry.upvotes);
                const downvoteIds = new Set(entry.downvotes ?? []);
                return (
                  <WatchlistCard
                    key={entry._id}
                    movie={entry.movie}
                    upvotes={entry.upvotes.length}
                    hasUpvoted={user ? upvoteIds.has(user._id) : false}
                    downvotes={(entry.downvotes ?? []).length}
                    hasDownvoted={user ? downvoteIds.has(user._id) : false}
                    addedBy={entry.addedBy?.name ?? undefined}
                    note={entry.note ?? undefined}
                    onUpvote={() => handleUpvote(entry._id)}
                    onDownvote={() => handleDownvote(entry._id)}
                    onRemove={() => handleRemove(entry._id)}
                    canRemove={
                      user
                        ? (user as { isOwner?: boolean }).isOwner ||
                          entry.addedBy?._id === user._id
                        : false
                    }
                    onClick={() => {
                      if (entry.movie) {
                        setDetailMovie(entry.movie);
                      }
                    }}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (filteredList?.length ?? 0) > PAGE_SIZE && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => goToPage(safePage - 1)}
                      className={
                        safePage <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {getPageItems(pageIndex, totalPages).map((item) =>
                    item.kind === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${item.id}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item.page}>
                        <PaginationLink
                          isActive={pageIndex === item.page}
                          onClick={() => goToPage(item.page + 1)}
                          className="cursor-pointer"
                        >
                          {item.page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => goToPage(safePage + 1)}
                      className={
                        safePage >= totalPages
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
            title={tEmpty("noFilterMatchTitle")}
            description={tEmpty("noFilterMatchDesc")}
          />
        ) : (
          <EmptyState
            icon={Film}
            title={tEmpty("watchlistEmptyPageTitle")}
            description={tEmpty("watchlistEmptyPageDesc")}
            actionLabel={tEmpty("addFirstMovieAction")}
            onAction={() => setSearchOpen(true)}
          />
        )}
      </div>

      <TMDBSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        mode="watchlist"
      />

      <MovieDetailDialog
        movie={detailMovie as Parameters<typeof MovieDetailDialog>[0]["movie"]}
        open={!!detailMovie}
        onClose={() => {
          setDetailMovie(null);
        }}
        onMarkWatched={handleMarkWatched}
      />
    </AppShell>
  );
}
