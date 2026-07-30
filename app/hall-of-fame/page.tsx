"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import {
  SimpleBarChart,
  SimpleHorizontalBars,
} from "@/components/simple-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Flame,
  BarChart3,
  MessageSquareQuote,
} from "lucide-react";
import Link from "next/link";

function AwardCard({
  title,
  description,
  user,
  stat,
}: {
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
  return (
    <Card className="h-full shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {user ? (
          <Link
            href={`/profile/${user._id}`}
            className="flex items-center gap-3 rounded-md hover:bg-accent/40 -mx-1 px-1 py-1 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar ?? user.image} />
              <AvatarFallback className="text-xs">
                {user.name[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              {stat ? (
                <p className="text-xs text-muted-foreground">{stat}</p>
              ) : null}
            </div>
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            Not enough data yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function HallOfFamePage() {
  const [now] = useState(() => Date.now());
  const year = useMemo(() => new Date(now).getFullYear(), [now]);

  const fame = useQuery(api.stats.getHallOfFame);
  const charts = useQuery(api.stats.getCharts, { now });
  const wrap = useQuery(api.stats.getSeasonWrap, { year });
  const roasts = useQuery(api.stats.getRoasts);
  const activity = useQuery(api.activity.getRecentActivity, { limit: 10 });

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Hall of Fame
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Leaderboards, charts, roasts, and the year so far.
          </p>
        </div>

        {/* Awards */}
        <section className="space-y-3">
          <h2 className="font-semibold">Titles</h2>
          {fame === undefined ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : fame === null ? (
            <EmptyState
              icon={Trophy}
              title="Sign in to see the Hall of Fame"
              description="Leaderboards unlock once you are in the crew."
              actionLabel="Go to login"
              actionHref="/login"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <AwardCard
                title="Harshest critic"
                description="Lowest average rating"
                user={fame.harshest?.user ?? null}
                stat={
                  fame.harshest
                    ? `avg ${fame.harshest.avgScore.toFixed(1)} · ${fame.harshest.count} ratings`
                    : undefined
                }
              />
              <AwardCard
                title="Softie"
                description="Highest average rating"
                user={fame.softie?.user ?? null}
                stat={
                  fame.softie
                    ? `avg ${fame.softie.avgScore.toFixed(1)} · ${fame.softie.count} ratings`
                    : undefined
                }
              />
              <AwardCard
                title="Worst movie suggester"
                description="Picks that scored lowest after watching"
                user={fame.worstSuggester?.user ?? null}
                stat={
                  fame.worstSuggester
                    ? `group avg ${fame.worstSuggester.avgGroupScore.toFixed(1)} · ${fame.worstSuggester.count} picks`
                    : undefined
                }
              />
              <AwardCard
                title="Oracle"
                description="Picks that scored highest after watching"
                user={fame.oracle?.user ?? null}
                stat={
                  fame.oracle
                    ? `group avg ${fame.oracle.avgGroupScore.toFixed(1)} · ${fame.oracle.count} picks`
                    : undefined
                }
              />
              <AwardCard
                title="Host with the most"
                description="Most movie nights hosted"
                user={fame.topHost?.user ?? null}
                stat={
                  fame.topHost
                    ? `${fame.topHost.count} night${fame.topHost.count === 1 ? "" : "s"}`
                    : undefined
                }
              />
              <AwardCard
                title="Controversy"
                description="Biggest rating gap on a film"
                user={fame.controversy?.user ?? null}
                stat={
                  fame.controversy
                    ? `${fame.controversy.movieTitle} · spread ${fame.controversy.spread}`
                    : undefined
                }
              />
            </div>
          )}
        </section>

        {/* Charts */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Charts</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Watched per month</p>
                {charts === undefined ? (
                  <Skeleton className="h-36 w-full" />
                ) : (
                  <SimpleBarChart
                    data={charts.byMonth.map((m) => ({
                      label: m.label,
                      value: m.count,
                    }))}
                    emptyLabel="Log some watches to see the trend"
                  />
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Rating distribution</p>
                {charts === undefined ? (
                  <Skeleton className="h-36 w-full" />
                ) : (
                  <SimpleBarChart
                    data={charts.ratingHistogram.map((b) => ({
                      label: String(b.score),
                      value: b.count,
                    }))}
                    emptyLabel="Ratings will stack up here"
                  />
                )}
              </CardContent>
            </Card>
            <Card className="shadow-sm md:col-span-2">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Genre mix</p>
                {charts === undefined ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <SimpleHorizontalBars
                    data={charts.byGenre.map((g) => ({
                      label: g.genre,
                      value: g.count,
                    }))}
                    emptyLabel="Genres appear after you log movies"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Season wrap */}
        <section className="space-y-3">
          <h2 className="font-semibold">{year} wrap</h2>
          {wrap === undefined ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : wrap === null ? (
            <p className="text-sm text-muted-foreground">Sign in to see wrap stats.</p>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Movies", value: wrap.moviesWatched },
                    { label: "Nights", value: wrap.nightsHeld },
                    { label: "Ratings", value: wrap.ratingsLogged },
                    {
                      label: "Avg score",
                      value:
                        wrap.avgRating != null
                          ? wrap.avgRating.toFixed(1)
                          : "—",
                    },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Best film: </span>
                    {wrap.best
                      ? `${wrap.best.title} (${wrap.best.score.toFixed(1)})`
                      : "TBD"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Flop: </span>
                    {wrap.worst
                      ? `${wrap.worst.title} (${wrap.worst.score.toFixed(1)})`
                      : "TBD"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Most debated: </span>
                    {wrap.mostControversial
                      ? `${wrap.mostControversial.title} (±${wrap.mostControversial.spread})`
                      : "TBD"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Longest sit: </span>
                    {wrap.longest
                      ? `${wrap.longest.title} (${wrap.longest.runtime}m)`
                      : "TBD"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Roasts */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Roast cards</h2>
          </div>
          {roasts === undefined ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : roasts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing to roast yet. Be interesting.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {roasts.map((line) => (
                <Card key={line} className="shadow-sm border-dashed">
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed">{line}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Activity */}
        <section className="space-y-3">
          <h2 className="font-semibold">Recent activity</h2>
          {activity === undefined ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={Flame}
              title="No activity yet"
              description="Adds, watches, and nights will show up here."
              compact
            />
          ) : (
            <div className="space-y-2">
              {activity.map((item) => (
                <Link key={item.id} href={item.href} className="block">
                  <Card className="hover:bg-accent/30 transition-colors shadow-sm">
                    <CardContent className="p-3.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {item.type.replace("_", " ")}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
