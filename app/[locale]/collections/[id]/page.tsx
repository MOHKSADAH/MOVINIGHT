"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getLocalizedMovieTitle } from "@/lib/locale";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppShell } from "@/components/app-shell";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { TMDBSearch } from "@/components/tmdb-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Film } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type CollectionMovie = {
  _id: string;
  tmdbId: number;
  title: string;
  titleAr?: string | null;
  poster: string;
  backdrop?: string;
  overview: string;
  genres: string[];
  runtime?: number;
  releaseYear: number;
  imdbRating?: number;
};

export default function CollectionDetailPage() {
  const t = useTranslations("collections");
  const tWatchlist = useTranslations("watchlist");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as Id<"collections">;

  const [searchOpen, setSearchOpen] = useState(false);
  const [detailMovie, setDetailMovie] = useState<CollectionMovie | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const collection = useQuery(api.collections.getCollection, { collectionId });
  const addMovieToCollection = useMutation(api.collections.addMovieToCollection);
  const removeMovieFromCollection = useMutation(api.collections.removeMovieFromCollection);
  const deleteCollection = useMutation(api.collections.deleteCollection);

  const handleMovieAdded = async (movieId: Id<"movies">) => {
    try {
      await addMovieToCollection({ collectionId, movieId });
      toast.success(t("toastAddedToCollection"));
    } catch {
      toast.error(t("toastAddMovieFailed"));
    }
  };

  const handleRemoveMovie = async (entryId: Id<"collection_movies">) => {
    try {
      await removeMovieFromCollection({ entryId });
      toast.success(t("toastRemovedFromCollection"));
    } catch {
      toast.error(t("toastRemoveFailed"));
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await deleteCollection({ collectionId });
      toast.success(t("toastCollectionDeleted"));
      router.push("/collections");
    } catch {
      toast.error(t("toastDeleteCollectionFailed"));
    }
  };

  if (collection === undefined) {
    return (
      <AppShell>
        <div className="p-6 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="aspect-2/3 rounded-lg" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!collection) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("notFound")}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back */}
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          onClick={() => router.push("/collections")}
        >
          <ArrowLeft className="h-4 w-4" />
          {t("allCollections")}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {collection.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {tCommon("byOwner", { name: collection.ownerName })}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {tCommon("moviesCount", { count: collection.movies.length })}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setSearchOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {tWatchlist("addMovie")}
            </Button>
            {collection.isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Movies grid */}
        {collection.movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Film className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">{t("noMoviesYet")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("noMoviesYetDesc")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={() => setSearchOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {tWatchlist("addMovie")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {collection.movies.map((entry) => {
              const movie = entry.movie as CollectionMovie & { _id: string };
              const movieTitle = getLocalizedMovieTitle(movie, locale);
              return (
                <div
                  key={entry.entryId as string}
                  className="group rounded-lg border border-border bg-card overflow-hidden flex flex-col hover:border-border/70 transition-colors"
                >
                  {/* Poster */}
                  <div
                    className="relative aspect-2/3 bg-muted cursor-pointer"
                    onClick={() => setDetailMovie(movie)}
                  >
                    {movie.poster && movie.poster !== "/placeholder.jpg" ? (
                      <Image
                        src={movie.poster}
                        alt={movieTitle}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                        {movieTitle}
                      </div>
                    )}
                    {movie.imdbRating && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5">
                        <span className="text-[10px] font-bold text-yellow-400">IMDb</span>
                        <span className="text-xs font-semibold text-white">
                          {movie.imdbRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {collection.isOwner && (
                      <button
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-destructive/80 rounded p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMovie(entry.entryId as Id<"collection_movies">);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                      </button>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-2.5 flex flex-col gap-1 flex-1">
                    <h3 className="font-medium text-xs leading-tight line-clamp-2">
                      {movie.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {movie.releaseYear}
                      {movie.runtime ? ` · ${movie.runtime}m` : ""}
                    </p>
                    {movie.genres.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-auto">
                        {movie.genres.slice(0, 2).map((g) => (
                          <Badge
                            key={g}
                            variant="secondary"
                            className="text-[9px] px-1 py-0 h-3.5"
                          >
                            {g}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TMDB Search */}
      <TMDBSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        mode="collection"
        onMovieAdded={handleMovieAdded}
      />

      {/* Movie Detail */}
      {detailMovie && (
        <MovieDetailDialog
          movie={detailMovie}
          open={!!detailMovie}
          onClose={() => setDetailMovie(null)}
        />
      )}

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialogDescription", {
                name: collection.name,
                count: collection.movies.length,
                moviesLabel:
                  collection.movies.length === 1
                    ? tCommon("movie")
                    : tCommon("movies"),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteCollection}>
              {tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
