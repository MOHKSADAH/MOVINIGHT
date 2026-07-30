"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ActivityFeed } from "@/components/activity-feed";
import {
  SimpleBarChart,
  SimpleHorizontalBars,
} from "@/components/simple-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Flame,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function AwardCard({
  index,
  title,
  description,
  user,
  stat,
}: {
  index: string;
  title: string;
  description: string;
  user: {
    _id: string;
    name: string;
    image?: string;
    avatar?: string;
  } | null;
  stat?: string;
}) {
  const tCommon = useTranslations("common");
  const claimed = Boolean(user);

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-5 rounded-lg border border-border bg-card p-5",
        claimed && "border-s-primary/70",
      )}
    >
      <div className="flex flex-col gap-2 text-start">
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground">
          {index}
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-auto border-t border-border/80 pt-4">
        {user ? (
          <Link
            href={`/profile/${user._id}`}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <Avatar className="size-8">
              <AvatarImage src={user.avatar ?? user.image} />
              <AvatarFallback className="text-[10px]">
                {user.name[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-sm font-medium" dir="auto">
                {user.name}
              </p>
              {stat ? (
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {stat}
                </p>
              ) : null}
            </div>
          </Link>
        ) : (
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground/80">
            {tCommon("notEnoughDataYet")}
          </p>
        )}
      </div>
    </article>
  );
}

export default function HallOfFamePage() {
  const t = useTranslations("hallOfFame");
  const tEmpty = useTranslations("empty");
  const tCommon = useTranslations("common");

  const [now] = useState(() => Date.now());
  const year = useMemo(() => new Date(now).getFullYear(), [now]);

  const fame = useQuery(api.stats.getHallOfFame);
  const charts = useQuery(api.stats.getCharts, { now });
  const wrap = useQuery(api.stats.getSeasonWrap, { year });
  const roasts = useQuery(api.stats.getRoasts);
  const activity = useQuery(api.activity.getRecentActivity, { limit: 10 });

  return (
    <AppShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Awards */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t("titlesSection")}
          </h2>
          {fame === undefined ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-lg" />
              ))}
            </div>
          ) : fame === null ? (
            <EmptyState
              icon={Trophy}
              title={tEmpty("hofSignInTitle")}
              description={tEmpty("hofSignInDesc")}
              actionLabel={t("goToLogin")}
              actionHref="/login"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AwardCard
                index="01"
                title={t("awardHarshestTitle")}
                description={t("awardHarshestDesc")}
                user={fame.harshest?.user ?? null}
                stat={
                  fame.harshest
                    ? t("statAvgRatings", {
                        score: fame.harshest.avgScore.toFixed(1),
                        count: fame.harshest.count,
                      })
                    : undefined
                }
              />
              <AwardCard
                index="02"
                title={t("awardSoftieTitle")}
                description={t("awardSoftieDesc")}
                user={fame.softie?.user ?? null}
                stat={
                  fame.softie
                    ? t("statAvgRatings", {
                        score: fame.softie.avgScore.toFixed(1),
                        count: fame.softie.count,
                      })
                    : undefined
                }
              />
              <AwardCard
                index="03"
                title={t("awardWorstSuggesterTitle")}
                description={t("awardWorstSuggesterDesc")}
                user={fame.worstSuggester?.user ?? null}
                stat={
                  fame.worstSuggester
                    ? t("statGroupAvgPicks", {
                        score: fame.worstSuggester.avgGroupScore.toFixed(1),
                        count: fame.worstSuggester.count,
                      })
                    : undefined
                }
              />
              <AwardCard
                index="04"
                title={t("awardOracleTitle")}
                description={t("awardOracleDesc")}
                user={fame.oracle?.user ?? null}
                stat={
                  fame.oracle
                    ? t("statGroupAvgPicks", {
                        score: fame.oracle.avgGroupScore.toFixed(1),
                        count: fame.oracle.count,
                      })
                    : undefined
                }
              />
              <AwardCard
                index="05"
                title={t("awardHostTitle")}
                description={t("awardHostDesc")}
                user={fame.topHost?.user ?? null}
                stat={
                  fame.topHost
                    ? fame.topHost.count === 1
                      ? t("statNightsHosted", { count: fame.topHost.count })
                      : t("statNightsHostedPlural", {
                          count: fame.topHost.count,
                        })
                    : undefined
                }
              />
              <AwardCard
                index="06"
                title={t("awardControversyTitle")}
                description={t("awardControversyDesc")}
                user={fame.controversy?.user ?? null}
                stat={
                  fame.controversy
                    ? t("statControversy", {
                        movieTitle: fame.controversy.movieTitle,
                        spread: fame.controversy.spread,
                      })
                    : undefined
                }
              />
            </div>
          )}
        </section>

        {/* Charts */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t("chartsSection")}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="gap-0 py-0 shadow-none">
              <CardContent className="flex flex-col gap-3 p-5">
                <p className="text-sm font-medium">{t("chartWatchedPerMonth")}</p>
                {charts === undefined ? (
                  <Skeleton className="h-36 w-full" />
                ) : (
                  <SimpleBarChart
                    data={charts.byMonth.map((m) => ({
                      label: m.label,
                      value: m.count,
                    }))}
                    emptyLabel={t("chartEmptyWatches")}
                  />
                )}
              </CardContent>
            </Card>
            <Card className="gap-0 py-0 shadow-none">
              <CardContent className="flex flex-col gap-3 p-5">
                <p className="text-sm font-medium">
                  {t("chartRatingDistribution")}
                </p>
                {charts === undefined ? (
                  <Skeleton className="h-36 w-full" />
                ) : (
                  <SimpleBarChart
                    data={charts.ratingHistogram.map((b) => ({
                      label: String(b.score),
                      value: b.count,
                    }))}
                    emptyLabel={t("chartEmptyRatings")}
                  />
                )}
              </CardContent>
            </Card>
            <Card className="gap-0 py-0 shadow-none md:col-span-2">
              <CardContent className="flex flex-col gap-3 p-5">
                <p className="text-sm font-medium">{t("chartGenreMix")}</p>
                {charts === undefined ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <SimpleHorizontalBars
                    data={charts.byGenre.map((g) => ({
                      label: g.genre,
                      value: g.count,
                    }))}
                    emptyLabel={t("chartEmptyGenres")}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Season wrap */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t("wrapSection", { year })}
          </h2>
          {wrap === undefined ? (
            <Skeleton className="h-40 rounded-lg" />
          ) : wrap === null ? (
            <p className="text-sm text-muted-foreground">{t("wrapSignIn")}</p>
          ) : (
            <Card className="gap-0 py-0 shadow-none">
              <CardContent className="flex flex-col gap-5 p-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: t("wrapMovies"), value: wrap.moviesWatched },
                    { label: t("wrapNights"), value: wrap.nightsHeld },
                    { label: t("wrapRatings"), value: wrap.ratingsLogged },
                    {
                      label: t("wrapAvgScore"),
                      value:
                        wrap.avgRating != null
                          ? wrap.avgRating.toFixed(1)
                          : "—",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-md border border-border bg-muted/40 p-3"
                    >
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="mt-1 font-mono text-xl font-semibold tracking-tight">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">
                      {t("wrapBestFilm")}{" "}
                    </span>
                    {wrap.best
                      ? t("wrapFilmScore", {
                          title: wrap.best.title,
                          score: wrap.best.score.toFixed(1),
                        })
                      : tCommon("tbd")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t("wrapFlop")}{" "}
                    </span>
                    {wrap.worst
                      ? t("wrapFilmScore", {
                          title: wrap.worst.title,
                          score: wrap.worst.score.toFixed(1),
                        })
                      : tCommon("tbd")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t("wrapMostDebated")}{" "}
                    </span>
                    {wrap.mostControversial
                      ? t("wrapSpread", {
                          title: wrap.mostControversial.title,
                          spread: wrap.mostControversial.spread,
                        })
                      : tCommon("tbd")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      {t("wrapLongestSit")}{" "}
                    </span>
                    {wrap.longest
                      ? t("wrapRuntime", {
                          title: wrap.longest.title,
                          runtime: wrap.longest.runtime,
                        })
                      : tCommon("tbd")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Roasts */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t("roastsSection")}
          </h2>
          {roasts === undefined ? (
            <Skeleton className="h-24 rounded-lg" />
          ) : roasts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("roastsEmpty")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {roasts.map((line) => (
                <Card key={line} className="gap-0 border-dashed py-0 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {line}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Activity */}
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t("activitySection")}
          </h2>
          <ActivityFeed
            items={activity}
            emptyIcon={Flame}
            emptyTitle={tEmpty("noActivityTitle")}
            emptyDescription={tEmpty("noActivityDesc")}
            now={now}
          />
        </section>
      </div>
    </AppShell>
  );
}
