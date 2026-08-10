"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDateFnsLocale,
  getLocalizedMovieTitle,
  type MovieTitleFields,
} from "@/lib/locale";

interface Movie extends MovieTitleFields {
  _id: string;
  poster: string;
  releaseYear: number;
  imdbRating?: number;
  genres: string[];
  overview: string;
  runtime?: number;
}

interface WatchlistCardProps {
  movie: Movie;
  upvotes: number;
  hasUpvoted: boolean;
  downvotes: number;
  hasDownvoted: boolean;
  addedBy?: string;
  note?: string;
  onUpvote: () => void;
  onDownvote: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
  onClick?: () => void;
}

export function WatchlistCard({
  movie,
  upvotes,
  hasUpvoted,
  downvotes,
  hasDownvoted,
  addedBy,
  note,
  onUpvote,
  onDownvote,
  onRemove,
  canRemove,
  onClick,
}: WatchlistCardProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const title = getLocalizedMovieTitle(movie, locale);

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden flex flex-col hover:border-border/80 transition-colors">
      <div className="relative aspect-2/3 bg-muted shrink-0 cursor-pointer">
        {movie.poster && movie.poster !== "/placeholder.jpg" ? (
          <Image
            src={movie.poster}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-3">
            {title}
          </div>
        )}
        {onClick && (
          <button
            type="button"
            className="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent p-0"
            onClick={onClick}
            aria-label={title}
          />
        )}
        {movie.imdbRating && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-yellow-400">{tCommon("imdb")}</span>
            <span className="text-xs font-semibold text-white">
              {movie.imdbRating.toFixed(1)}
            </span>
          </div>
        )}
        {canRemove && onRemove && (
          <button
            type="button"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-destructive/80 rounded p-1"
            aria-label={tCommon("remove")}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {movie.releaseYear}
            {movie.runtime ? ` · ${movie.runtime}m` : ""}
          </p>
        </div>

        {movie.genres.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {movie.genres.slice(0, 2).map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {g}
              </Badge>
            ))}
          </div>
        )}

        {note && (
          <p className="text-xs text-muted-foreground italic line-clamp-1">
            &ldquo;{note}&rdquo;
          </p>
        )}

        {addedBy && (
          <p className="text-[10px] text-muted-foreground">
            {tCommon("addedBy", { name: addedBy })}
          </p>
        )}

        <div className="flex gap-1.5 mt-auto pt-1">
          <Button
            variant={hasUpvoted ? "default" : "outline"}
            size="sm"
            className={cn("flex-1 h-7 gap-1.5 text-xs", hasUpvoted && "bg-primary")}
            onClick={onUpvote}
          >
            <ThumbsUp className="h-3 w-3" />
            {upvotes}
          </Button>
          <Button
            variant={hasDownvoted ? "destructive" : "outline"}
            size="sm"
            className="flex-1 h-7 gap-1.5 text-xs"
            onClick={onDownvote}
          >
            <ThumbsDown className="h-3 w-3" />
            {downvotes}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface WatchedGridCardProps {
  movie: Movie;
  watchedAt: number;
  avgRating?: number;
  myRating?: { score: number; note?: string };
  ratingCount: number;
  onClick: () => void;
  onRate: () => void;
  onDelete?: () => void;
}

export function WatchedGridCard({
  movie,
  watchedAt,
  avgRating,
  myRating,
  ratingCount,
  onClick,
  onRate,
  onDelete,
}: WatchedGridCardProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tWatched = useTranslations("watched");
  const title = getLocalizedMovieTitle(movie, locale);
  const date = format(new Date(watchedAt), "MMM d, yyyy", {
    locale: getDateFnsLocale(locale),
  });

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden flex flex-col hover:border-border/80 transition-colors">
      <div className="relative aspect-2/3 bg-muted shrink-0 cursor-pointer">
        {movie.poster && movie.poster !== "/placeholder.jpg" ? (
          <Image
            src={movie.poster}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-3">
            {title}
          </div>
        )}
        <button
          type="button"
          className="absolute inset-0 z-[1] cursor-pointer border-0 bg-transparent p-0"
          onClick={onClick}
          aria-label={title}
        />
        {movie.imdbRating && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-bold text-yellow-400">{tCommon("imdb")}</span>
            <span className="text-xs font-semibold text-white">
              {movie.imdbRating.toFixed(1)}
            </span>
          </div>
        )}
        {myRating && !onDelete && (
          <div className="absolute top-2 right-2 z-10 bg-black/70 rounded px-1.5 py-0.5">
            <span className="text-[10px] font-semibold text-white">
              {tCommon("youRating", { score: myRating.score })}
            </span>
          </div>
        )}
        {onDelete && (
          <button
            type="button"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-destructive/80 rounded p-1"
            aria-label={tCommon("delete")}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="font-medium text-sm leading-tight line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{date}</p>
        {avgRating !== undefined && (
          <p className="text-xs text-muted-foreground">
            {tCommon("groupRating")}{" "}
            <span className="font-medium text-foreground">
              {avgRating.toFixed(1)}
            </span>{" "}
            <span className="text-[10px]">({ratingCount})</span>
          </p>
        )}
        <div className="mt-auto pt-1">
          <Button
            variant={myRating ? "outline" : "default"}
            size="sm"
            className="w-full h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRate();
            }}
          >
            {myRating ? tWatched("updateRating") : tWatched("rateThis")}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MoviePosterCardProps {
  movie: Movie;
  onClick?: () => void;
  selected?: boolean;
}

export function MoviePosterCard({ movie, onClick, selected }: MoviePosterCardProps) {
  const locale = useLocale();
  const title = getLocalizedMovieTitle(movie, locale);

  return (
    <button
      type="button"
      className={cn(
        "relative rounded-lg overflow-hidden border-2 transition-all block w-full p-0 text-left",
        selected ? "border-primary shadow-lg" : "border-transparent hover:border-border",
      )}
      onClick={onClick}
      aria-label={title}
      aria-pressed={selected}
    >
      <div className="relative aspect-2/3 bg-muted">
        {movie.poster && movie.poster !== "/placeholder.jpg" ? (
          <Image
            src={movie.poster}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
            {title}
          </div>
        )}
      </div>
      <div className="p-2 bg-card">
        <p className="text-xs font-medium truncate" dir="auto">
          {title}
        </p>
        <p className="text-[10px] text-muted-foreground">{movie.releaseYear}</p>
      </div>
    </button>
  );
}
