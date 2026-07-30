"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { MovieDetailDialog } from "@/components/movie-detail-dialog";
import { EmptyState } from "@/components/empty-state";
import { NightCountdown } from "@/components/night-countdown";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Film,
  List,
  Eye,
  CalendarDays,
  ChevronRight,
  Star,
  ThumbsUp,
  Plus,
  Clapperboard,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string | undefined;
  icon: React.ElementType;
  href: string;
}) {
  return (
    <Link href={href} className="block h-full min-w-0">
      <Card className="h-full hover:bg-accent/30 transition-colors cursor-pointer">
        <CardContent className="p-5 h-full">
          <div className="flex items-center justify-between gap-3 h-full min-h-[4.5rem]">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">{label}</p>
              {value === undefined ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p
                  className={cn(
                    "text-2xl font-bold mt-0.5 truncate leading-tight",
                    (value === 0 || value === "None") && "text-muted-foreground",
                  )}
                >
                  {value}
                </p>
              )}
            </div>
            <div className="p-2.5 rounded-full bg-muted shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
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
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold">{title}</h2>
      <Link href={href}>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
          {linkLabel} <ChevronRight className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  );
}

type DetailMovie = {
  _id: string;
  title: string;
  poster: string;
  backdrop?: string;
  releaseYear: number;
  imdbRating?: number;
  imdbVotes?: number;
  genres: string[];
  overview: string;
  runtime?: number;
};

const START_ACTIONS = [
  {
    href: "/watchlist",
    step: "01",
    title: "Add a movie",
    body: "Search and drop something on the shared watchlist.",
    icon: List,
  },
  {
    href: "/watched",
    step: "02",
    title: "Log a watch",
    body: "Record a film you already saw and leave a score.",
    icon: Eye,
  },
  {
    href: "/calendar",
    step: "03",
    title: "Schedule a night",
    body: "Lock a date so the crew can show up and pick.",
    icon: CalendarDays,
  },
] as const;

const HOW_IT_WORKS = [
  {
    icon: List,
    title: "Build the watchlist",
    body: "Add films you want to see. Upvote the ones you care about most.",
  },
  {
    icon: CalendarDays,
    title: "Pick a night",
    body: "Schedule a movie night, RSVP, and shortlist candidates together.",
  },
  {
    icon: Star,
    title: "Watch & rate",
    body: "Log what you watched and leave a score so the crew remembers.",
  },
] as const;

const QUICK_LINKS = [
  {
    href: "/watchlist",
    icon: Plus,
    title: "Add a movie",
    body: "Search TMDB and drop it on the list",
  },
  {
    href: "/watched",
    icon: Eye,
    title: "Log something you saw",
    body: "Keep the history and ratings going",
  },
  {
    href: "/calendar",
    icon: CalendarDays,
    title: "Schedule a night",
    body: "Lock a date so everyone can show up",
  },
  {
    href: "/members",
    icon: Clapperboard,
    title: "See the crew",
    body: "Profiles, vibes, and who you’re watching with",
  },
] as const;

export default function DashboardPage() {
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
        ? new Date(nextNight.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "None";

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
                  Welcome back
                  {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Your group movie tracker
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Watchlist"
            value={watchlistCount}
            icon={List}
            href="/watchlist"
          />
          <StatCard
            label="Watched"
            value={watchedCount}
            icon={Eye}
            href="/watched"
          />
          <StatCard
            label="Next Night"
            value={nextNightValue}
            icon={CalendarDays}
            href="/calendar"
          />
        </div>

        {/* First-run: three equal action cards */}
        {isFirstRun && (
          <div>
            <div className="mb-3">
              <h2 className="font-semibold">Start here</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Nothing logged yet. Pick any path and this page fills in as you
                go.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {START_ACTIONS.map((action) => (
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
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {action.body}
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
          <SectionHeader title="Next Movie Night" href="/calendar" linkLabel="All nights" />
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{nextNight.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {new Date(nextNight.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <NightCountdown
                        targetMs={nextNight.date}
                        className="mt-2"
                      />
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="secondary">
                        {nextNight.attendees.length} attending
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {nextNight.candidates.length} candidates
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <EmptyState
              icon={Clapperboard}
              title="No night on the calendar"
              description="Pick a date, invite the crew, and start shortlisting films."
              actionLabel="Schedule a night"
              actionHref="/calendar"
              compact
            />
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Top watchlist picks */}
          <div>
            <SectionHeader title="Top voted" href="/watchlist" />
            <div className="space-y-2">
              {watchlist === undefined ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={`wl-skel-${i}`}
                    className="flex gap-3 p-3.5 rounded-lg border border-border"
                  >
                    <Skeleton className="w-14 h-21 rounded shrink-0" />
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-3 w-1/3 mt-2" />
                    </div>
                  </div>
                ))
              ) : topVoted && topVoted.length > 0 ? (
                topVoted.map((entry) =>
                  entry.movie ? (
                    <button
                      type="button"
                      key={entry._id}
                      className="w-full text-left flex gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={() => setDetailMovie(entry.movie as DetailMovie)}
                    >
                      <div className="relative w-14 h-21 rounded overflow-hidden bg-muted shrink-0">
                        {entry.movie.poster &&
                          entry.movie.poster !== "/placeholder.jpg" && (
                            <Image
                              src={entry.movie.poster}
                              alt={entry.movie.title}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          )}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-sm font-semibold truncate">
                          {entry.movie.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.movie.releaseYear}
                        </p>
                        {entry.movie.genres.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {entry.movie.genres.slice(0, 2).map((g) => (
                              <Badge
                                key={g}
                                variant="secondary"
                                className="text-[10px] h-4 px-1.5"
                              >
                                {g}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          {entry.movie.imdbRating != null && (
                            <span className="text-xs text-muted-foreground">
                              IMDb{" "}
                              <span className="font-medium text-foreground">
                                {entry.movie.imdbRating.toFixed(1)}
                              </span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{entry.upvotes.length}</span>
                          </span>
                        </div>
                      </div>
                    </button>
                  ) : null,
                )
              ) : (
                <EmptyState
                  icon={Film}
                  title="Watchlist is empty"
                  description="Add films you want to see together. Upvotes decide what rises to the top."
                  actionLabel="Add movies"
                  actionHref="/watchlist"
                  compact
                />
              )}
            </div>
          </div>

          {/* Recently watched */}
          <div>
            <SectionHeader title="Recently Watched" href="/watched" />
            <div className="space-y-2">
              {recentWatched === undefined ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={`rw-skel-${i}`}
                    className="flex gap-3 p-3.5 rounded-lg border border-border"
                  >
                    <Skeleton className="w-14 h-21 rounded shrink-0" />
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-3 w-1/3 mt-2" />
                    </div>
                  </div>
                ))
              ) : recentWatched.length > 0 ? (
                recentWatched.map((entry) => {
                  if (!entry.movie) return null;
                  const avgRating =
                    entry.ratings.length > 0
                      ? entry.ratings.reduce((s, r) => s + r.score, 0) /
                        entry.ratings.length
                      : null;
                  return (
                    <button
                      type="button"
                      key={entry._id}
                      className="w-full text-left flex gap-3 p-3.5 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={() => {
                        setDetailMovie(entry.movie as DetailMovie);
                        setDetailMode("watched");
                      }}
                    >
                      <div className="relative w-14 h-21 rounded overflow-hidden bg-muted shrink-0">
                        {entry.movie.poster &&
                          entry.movie.poster !== "/placeholder.jpg" && (
                            <Image
                              src={entry.movie.poster}
                              alt={entry.movie.title}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          )}
                      </div>
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-sm font-semibold truncate">
                          {entry.movie.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.watchedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {entry.movie.imdbRating != null && (
                            <span className="text-xs text-muted-foreground">
                              IMDb{" "}
                              <span className="font-medium text-foreground">
                                {entry.movie.imdbRating.toFixed(1)}
                              </span>
                            </span>
                          )}
                          {avgRating != null && (
                            <span className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span className="font-medium">
                                {avgRating.toFixed(1)}
                              </span>
                              <span className="text-muted-foreground">
                                ({entry.ratings.length})
                              </span>
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
                  title="Nothing watched yet"
                  description="Log a film after movie night so ratings and history show up here."
                  actionLabel="Log a movie"
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
            title="Recent activity"
            href="/hall-of-fame"
            linkLabel="Hall of Fame"
          />
          {activity === undefined ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={Clapperboard}
              title="Quiet so far"
              description="Adds, watches, and nights will land in this feed."
              compact
            />
          ) : (
            <div className="space-y-2">
              {activity.map((item) => (
                <Link key={item.id} href={item.href} className="block">
                  <Card className="hover:bg-accent/30 transition-colors shadow-sm">
                    <CardContent className="p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div>
          <h2 className="font-semibold mb-3">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {HOW_IT_WORKS.map((step, index) => (
              <Card key={step.title} className="shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      0{index + 1}
                    </span>
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="font-semibold mb-3">Jump in</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUICK_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="block h-full">
                <Card className="h-full hover:bg-accent/30 transition-colors cursor-pointer shadow-sm">
                  <CardContent className="p-4 flex gap-3 items-start">
                    <div className="p-2 rounded-full bg-muted shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.body}
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
                <p className="font-medium">Hall of Fame</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Leaderboards, charts, season wrap, and roast cards.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
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
