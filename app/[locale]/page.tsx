"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { EmptyState } from "@/components/empty-state";
import { NightCountdown } from "@/components/night-countdown";
import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Film,
  Eye,
  ChevronRight,
  Plus,
  Clapperboard,
  Trophy,
  List,
  CalendarDays,
  Star,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { format } from "date-fns";
import { getDateFnsLocale, getLocalizedMovieTitle } from "@/lib/locale";
import { averageFiveStarScores } from "@/lib/ratings";
import { cn } from "@/lib/utils";

function ImdbMark({ rating }: { rating: number }) {
  const tCommon = useTranslations("common");
  return (
    <span className="inline-flex items-baseline gap-1 font-mono text-xs tabular-nums">
      <span className="font-bold tracking-wide text-yellow-400">
        {tCommon("imdb")}
      </span>
      <span className="text-foreground">{rating.toFixed(1)}</span>
    </span>
  );
}

function StatCard({
  index,
  label,
  value,
  href,
}: {
  index: string;
  label: string;
  value: number | string | undefined;
  href: string;
}) {
  return (
    <Link href={href} className="block h-full min-w-0">
      <div
        className={cn(
          "flex h-full flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30",
          value !== undefined && value !== 0 && "border-s-primary/70",
        )}
      >
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          {index}
        </span>
        <div className="min-w-0 text-start">
          <p className="text-xs leading-snug text-muted-foreground">{label}</p>
          {value === undefined ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p
              className={cn(
                "mt-1 font-mono text-2xl font-semibold leading-tight tracking-tight",
                typeof value === "number" && "tabular-nums",
                typeof value === "string" ? "break-words" : "truncate",
                value === 0 && "text-muted-foreground",
              )}
            >
              {value}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="shrink-0 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="h-px flex-1 bg-border" />
      <Link href={href}>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs text-muted-foreground"
        >
          {linkLabel}
          <ChevronRight className="size-3 rtl:rotate-180" />
        </Button>
      </Link>
    </div>
  );
}

type DetailMovie = {
  _id: string;
  title: string;
  titleAr?: string | null;
  poster: string;
  backdrop?: string;
  releaseYear: number;
  imdbRating?: number;
  imdbVotes?: number;
  genres: string[];
  overview: string;
  overviewAr?: string | null;
  runtime?: number;
};

const START_ACTION_KEYS = [
  { href: "/watchlist", step: "01", titleKey: "startAddMovieTitle", bodyKey: "startAddMovieBody", icon: List },
  { href: "/watched", step: "02", titleKey: "startLogWatchTitle", bodyKey: "startLogWatchBody", icon: Eye },
  { href: "/calendar", step: "03", titleKey: "startScheduleTitle", bodyKey: "startScheduleBody", icon: CalendarDays },
] as const;

const HOW_IT_WORKS_KEYS = [
  { icon: List, titleKey: "howBuildWatchlistTitle", bodyKey: "howBuildWatchlistBody" },
  { icon: CalendarDays, titleKey: "howPickNightTitle", bodyKey: "howPickNightBody" },
  { icon: Star, titleKey: "howWatchRateTitle", bodyKey: "howWatchRateBody" },
] as const;

const QUICK_LINK_KEYS = [
  { href: "/watchlist", icon: Plus, titleKey: "quickAddMovieTitle", bodyKey: "quickAddMovieBody" },
  { href: "/watched", icon: Eye, titleKey: "quickLogTitle", bodyKey: "quickLogBody" },
  { href: "/calendar", icon: CalendarDays, titleKey: "quickScheduleTitle", bodyKey: "quickScheduleBody" },
] as const;

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tEmpty = useTranslations("empty");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const user = useQuery(api.users.getCurrentUser);
  const watchlistCount = useQuery(api.watchlist.getWatchlistCount);
  const watchedCount = useQuery(api.watched.getWatchedCount);
  const upcomingNights = useQuery(api.nights.getUpcomingNights);
  const recentWatched = useQuery(api.watched.getRecentWatched, { limit: 3 });
  const watchlist = useQuery(api.watchlist.getWatchlist);
  const activity = useQuery(api.activity.getRecentActivity, { limit: 6 });

  const [detailMovie, setDetailMovie] = useState<DetailMovie | null>(null);
  const [detailMode, setDetailMode] = useState<"watched" | null>(null);

  const nextNight = upcomingNights?.[0];
  const topVoted = watchlist?.slice(0, 3);

  const dataReady =
    watchlistCount !== undefined &&
    watchedCount !== undefined &&
    upcomingNights !== undefined;

  const isFirstRun =
    dataReady &&
    watchlistCount === 0 &&
    watchedCount === 0 &&
    upcomingNights.length === 0;

  const nextNightValue =
    upcomingNights === undefined
      ? undefined
      : nextNight
        ? format(new Date(nextNight.date), "d MMM", {
            locale: getDateFnsLocale(locale),
          })
        : tCommon("none");

  const dateFnsLocale = getDateFnsLocale(locale);

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          {user === undefined ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar ?? user?.image ?? undefined} />
                <AvatarFallback>
                  {user?.name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">
                  {user?.name
                    ? t("welcomeBackName", {
                        firstName: user.name.split(" ")[0] ?? user.name,
                      })
                    : t("welcomeBack")}
                </h1>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            index="01"
            label={t("statWatchlist")}
            value={watchlistCount}
            href="/watchlist"
          />
          <StatCard
            index="02"
            label={t("statWatched")}
            value={watchedCount}
            href="/watched"
          />
          <StatCard
            index="03"
            label={t("statNextNight")}
            value={nextNightValue}
            href="/calendar"
          />
        </div>

        {/* First-run: three equal action cards */}
        {isFirstRun && (
          <div>
            <div className="mb-3">
              <h2 className="font-semibold">{t("startHere")}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t("startHereBody")}
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {START_ACTION_KEYS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="block h-full min-w-0"
                >
                  <Card className="h-full hover:bg-accent/30 transition-colors cursor-pointer shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-3 h-full min-h-[140px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">
                          {action.step}
                        </span>
                        <action.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-auto space-y-1">
                        <p className="text-sm font-medium">{t(action.titleKey)}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t(action.bodyKey)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Next movie night */}
        <div>
          <SectionHeader title={t("nextMovieNight")} href="/calendar" linkLabel={t("allNights")} />
          {upcomingNights === undefined ? (
            <Card>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardContent>
            </Card>
          ) : nextNight ? (
            <Link href={`/night/${nextNight._id}`} className="block">
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 text-start">
                      <p className="font-medium truncate" dir="auto">
                        {nextNight.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {format(new Date(nextNight.date), "EEEE, MMMM d", {
                          locale: dateFnsLocale,
                        })}
                      </p>
                      <NightCountdown
                        targetMs={nextNight.date}
                        className="mt-2"
                      />
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {tCommon("candidates", { count: nextNight.candidates.length })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <EmptyState
              icon={Clapperboard}
              title={tEmpty("noNightOnCalendarTitle")}
              description={tEmpty("noNightOnCalendarDesc")}
              actionLabel={tEmpty("scheduleNightAction")}
              actionHref="/calendar"
              compact
            />
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Top watchlist picks */}
          <div>
            <SectionHeader
              title={t("topVoted")}
              href="/watchlist"
              linkLabel={tCommon("viewAll")}
            />
            <div className="flex flex-col">
              {watchlist === undefined ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={`wl-skel-${i}`}
                    className="flex gap-3 border-b border-border py-3.5"
                  >
                    <Skeleton className="h-21 w-14 shrink-0 rounded" />
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="mt-2 h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : topVoted && topVoted.length > 0 ? (
                topVoted.map((entry, index) =>
                  entry.movie ? (
                    <button
                      type="button"
                      key={entry._id}
                      className="group flex w-full gap-3 border-b border-border py-3.5 text-start transition-colors hover:bg-muted/30 -mx-2 rounded-md px-2 sm:-mx-3 sm:px-3"
                      onClick={() => setDetailMovie(entry.movie as DetailMovie)}
                    >
                      {(() => {
                        const movieTitle = getLocalizedMovieTitle(
                          entry.movie,
                          locale,
                        );
                        return (
                          <>
                            <span className="hidden w-5 shrink-0 pt-1 text-end font-mono text-[11px] tabular-nums text-muted-foreground sm:block">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="relative h-21 w-14 shrink-0 overflow-hidden rounded bg-muted">
                              {entry.movie.poster &&
                                entry.movie.poster !== "/placeholder.jpg" && (
                                  <Image
                                    src={entry.movie.poster}
                                    alt={movieTitle}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                  />
                                )}
                            </div>
                            <div className="min-w-0 flex-1 py-0.5 text-start">
                              <p
                                className="truncate text-sm font-semibold tracking-tight"
                                dir="auto"
                              >
                                {movieTitle}
                              </p>
                              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                {entry.movie.releaseYear}
                                {entry.movie.genres[0]
                                  ? ` · ${entry.movie.genres[0]}`
                                  : ""}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                {entry.movie.imdbRating != null && (
                                  <ImdbMark rating={entry.movie.imdbRating} />
                                )}
                                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                                  {t("votesCount", {
                                    count: entry.upvotes.length,
                                  })}
                                </span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </button>
                  ) : null,
                )
              ) : (
                <EmptyState
                  icon={Film}
                  title={tEmpty("watchlistEmptyTitle")}
                  description={tEmpty("watchlistEmptyDesc")}
                  actionLabel={tEmpty("addMoviesAction")}
                  actionHref="/watchlist"
                  compact
                />
              )}
            </div>
          </div>

          {/* Recently watched */}
          <div>
            <SectionHeader
              title={t("recentlyWatched")}
              href="/watched"
              linkLabel={tCommon("viewAll")}
            />
            <div className="flex flex-col">
              {recentWatched === undefined ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={`rw-skel-${i}`}
                    className="flex gap-3 border-b border-border py-3.5"
                  >
                    <Skeleton className="h-21 w-14 shrink-0 rounded" />
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="mt-2 h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : recentWatched.length > 0 ? (
                recentWatched.map((entry, index) => {
                  if (!entry.movie) return null;
                  const avgRating = averageFiveStarScores(
                    entry.ratings.map((r) => r.score),
                  );
                  const movieTitle = getLocalizedMovieTitle(
                    entry.movie,
                    locale,
                  );
                  return (
                    <button
                      type="button"
                      key={entry._id}
                      className="group flex w-full gap-3 border-b border-border py-3.5 text-start transition-colors hover:bg-muted/30 -mx-2 rounded-md px-2 sm:-mx-3 sm:px-3"
                      onClick={() => {
                        setDetailMovie(entry.movie as DetailMovie);
                        setDetailMode("watched");
                      }}
                    >
                      <span className="hidden w-5 shrink-0 pt-1 text-end font-mono text-[11px] tabular-nums text-muted-foreground sm:block">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="relative h-21 w-14 shrink-0 overflow-hidden rounded bg-muted">
                        {entry.movie.poster &&
                          entry.movie.poster !== "/placeholder.jpg" && (
                            <Image
                              src={entry.movie.poster}
                              alt={movieTitle}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          )}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5 text-start">
                        <p
                          className="truncate text-sm font-semibold tracking-tight"
                          dir="auto"
                        >
                          {movieTitle}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {format(new Date(entry.watchedAt), "MMM d, yyyy", {
                            locale: dateFnsLocale,
                          })}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {entry.movie.imdbRating != null && (
                            <ImdbMark rating={entry.movie.imdbRating} />
                          )}
                          {avgRating != null && (
                            <span className="font-mono text-xs tabular-nums text-muted-foreground">
                              {t("crewScore", {
                                score: avgRating.toFixed(1),
                                count: entry.ratings.length,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <EmptyState
                  icon={Eye}
                  title={tEmpty("nothingWatchedTitle")}
                  description={tEmpty("nothingWatchedDesc")}
                  actionLabel={tEmpty("logMovieAction")}
                  actionHref="/watched"
                  compact
                />
              )}
            </div>
          </div>
        </div>

        {/* Activity */}
        <div>
          <SectionHeader
            title={t("recentActivity")}
            href="/hall-of-fame"
            linkLabel={t("hallOfFameLink")}
          />
          <ActivityFeed
            items={activity}
            emptyIcon={Clapperboard}
            emptyTitle={tEmpty("quietSoFarTitle")}
            emptyDescription={tEmpty("quietSoFarDesc")}
          />
        </div>

        {/* How it works */}
        <div>
          <h2 className="font-semibold mb-3">{t("howItWorks")}</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {HOW_IT_WORKS_KEYS.map((step, index) => (
              <Card key={step.titleKey} className="shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      0{index + 1}
                    </span>
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{t(step.titleKey)}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(step.bodyKey)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-semibold mb-3">{t("jumpIn")}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUICK_LINK_KEYS.map((item) => (
              <Link key={item.href} href={item.href} className="block h-full">
                <Card className="h-full hover:bg-accent/30 transition-colors cursor-pointer shadow-sm">
                  <CardContent className="p-4 flex gap-3 items-start">
                    <div className="p-2 rounded-full bg-muted shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1 text-start">
                      <p className="text-sm font-medium">{t(item.titleKey)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t(item.bodyKey)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <Link href="/hall-of-fame" className="block">
          <Card className="hover:bg-accent/30 transition-colors cursor-pointer shadow-sm">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="p-2.5 rounded-md bg-muted shrink-0 w-fit">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{t("hofCardTitle")}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("hofCardBody")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block rtl:rotate-180" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <MovieDetailDialog
        movie={detailMovie}
        open={!!detailMovie}
        onClose={() => {
          setDetailMovie(null);
          setDetailMode(null);
        }}
        onRate={
          detailMode === "watched"
            ? () => {
                setDetailMovie(null);
                setDetailMode(null);
              }
            : undefined
        }
      />
    </AppShell>
  );
}
