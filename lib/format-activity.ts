import { useLocale, useTranslations } from "next-intl";
import { getLocalizedMovieTitle } from "@/lib/locale";

export type ActivityItem = {
  id: string;
  type: "watchlist_add" | "watched" | "rating" | "night";
  at: number;
  href: string;
  actorName?: string;
  movieTitle?: string;
  movieTitleAr?: string;
  score?: number;
  note?: string;
  ratingCount?: number;
  nightTitle?: string;
  nightStatus?: string;
};

export function useFormatActivityItem() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tNights = useTranslations("nights");

  return (item: ActivityItem) => {
    const movieTitle = getLocalizedMovieTitle(
      { title: item.movieTitle ?? "", titleAr: item.movieTitleAr },
      locale,
    );
    const name = item.actorName ?? t("someone");

    const statusLabel = (() => {
      switch (item.nightStatus) {
        case "upcoming":
          return tNights("statusUpcoming");
        case "active":
          return tNights("statusNowPlaying");
        case "done":
          return tNights("statusDone");
        default:
          return item.nightStatus ?? "";
      }
    })();

    switch (item.type) {
      case "watchlist_add":
        return {
          title: t("activityWatchlistAdd", { name, title: movieTitle }),
          subtitle: t("activityWatchlistAddSubtitle"),
        };
      case "watched":
        return {
          title: t("activityWatched", { title: movieTitle }),
          subtitle:
            (item.ratingCount ?? 0) > 0
              ? t("activityRatingsCount", { count: item.ratingCount ?? 0 })
              : t("activityRatingsWaiting"),
        };
      case "rating":
        return {
          title: t("activityRated", {
            name,
            title: movieTitle,
            score: item.score ?? 0,
          }),
          subtitle: item.note ?? "",
        };
      case "night":
        return {
          title: item.nightTitle ?? "",
          subtitle: t("activityNightSubtitle", { status: statusLabel }),
        };
      default:
        return { title: "", subtitle: "" };
    }
  };
}
