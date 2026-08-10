"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { tmdbLanguageFromLocale } from "@/lib/locale";
import {
  fetchTmdbPersonDetail,
  getPersonFilmography,
  personProfileUrl,
  type CreditPerson,
} from "@/lib/tmdb-movie-upsert";

type FilmRow = {
  id: number;
  title: string;
  role: string;
  year: number | null;
  poster: string;
  rating?: number;
};

export function PersonFilmographyDialog({
  person,
  open,
  onClose,
  onSelectMovie,
  selectingMovie = false,
}: {
  person: CreditPerson | null;
  open: boolean;
  onClose: () => void;
  onSelectMovie: (tmdbId: number) => void;
  selectingMovie?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("watchlist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    biography?: string;
    knownFor?: string;
    birthday?: string;
    placeOfBirth?: string;
    imageUrl?: string;
    films: FilmRow[];
  } | null>(null);

  const personId = person?.id;

  useEffect(() => {
    if (!open || personId == null) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    setProfile(null);

    void (async () => {
      try {
        const detail = await fetchTmdbPersonDetail(
          personId,
          tmdbLanguageFromLocale(locale),
        );
        if (cancelled) return;
        setProfile({
          name: detail.name,
          biography: detail.biography?.trim() || undefined,
          knownFor: detail.known_for_department,
          birthday: detail.birthday ?? undefined,
          placeOfBirth: detail.place_of_birth ?? undefined,
          imageUrl: personProfileUrl(detail.profile_path) ?? person?.imageUrl,
          films: getPersonFilmography(detail),
        });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, personId, locale, person?.imageUrl]);

  const displayName = profile?.name ?? person?.name ?? "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-lg p-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">{displayName}</DialogTitle>
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="border-b border-border p-5">
            <div className="flex gap-4">
              <div
                className="relative shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border"
                style={{ width: 80, height: 80, minWidth: 80, minHeight: 80 }}
              >
                {(profile?.imageUrl ?? person?.imageUrl) ? (
                  <Image
                    src={profile?.imageUrl ?? person!.imageUrl!}
                    alt={displayName}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full max-w-none object-cover object-[center_15%]"
                    style={{ aspectRatio: "1 / 1" }}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xl font-semibold text-muted-foreground">
                    {displayName[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <h2 className="text-lg font-bold leading-tight">{displayName}</h2>
                {profile?.knownFor ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {profile.knownFor}
                  </p>
                ) : null}
                {profile?.birthday || profile?.placeOfBirth ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[profile.birthday, profile.placeOfBirth]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
            {profile?.biography ? (
              <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                {profile.biography}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {t("filmography")}
            </p>

            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("personLoadFailed")}
              </p>
            ) : profile && profile.films.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("noFilmography")}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {profile?.films.map((film) => (
                  <li key={film.id}>
                    <button
                      type="button"
                      disabled={selectingMovie}
                      className="flex w-full items-center gap-3 rounded-md border border-transparent p-2 text-start transition-colors hover:border-border hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                      onClick={() => onSelectMovie(film.id)}
                    >
                      <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-muted">
                        {film.poster !== "/placeholder.jpg" ? (
                          <Image
                            src={film.poster}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {film.title}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {film.year ? (
                            <span className="text-xs text-muted-foreground">
                              {film.year}
                            </span>
                          ) : null}
                          <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[10px] font-normal"
                          >
                            {film.role}
                          </Badge>
                          {film.rating && film.rating > 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                              {film.rating.toFixed(1)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
