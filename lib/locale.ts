import { ar, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { AppLocale } from "@/i18n/routing";

/** TMDB `language` query value for the active app locale. */
export function tmdbLanguageFromLocale(locale: string): "en-US" | "ar" {
  return locale === "ar" ? "ar" : "en-US";
}

export function isRtlLocale(locale: string): boolean {
  return locale === "ar";
}

export type MovieTitleFields = {
  title: string;
  titleAr?: string | null;
  overview?: string;
  overviewAr?: string | null;
};

export function getLocalizedMovieTitle(
  movie: Pick<MovieTitleFields, "title" | "titleAr">,
  locale: string,
): string {
  if (locale === "ar" && movie.titleAr) return movie.titleAr;
  return movie.title;
}

export function getLocalizedMovieOverview(
  movie: Pick<MovieTitleFields, "overview" | "overviewAr">,
  locale: string,
): string {
  if (locale === "ar" && movie.overviewAr) return movie.overviewAr;
  return movie.overview ?? "";
}

export function getDateFnsLocale(locale: AppLocale | string): Locale {
  return locale === "ar" ? ar : enUS;
}
