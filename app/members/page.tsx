"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clapperboard,
  Star,
  ListPlus,
  CalendarDays,
  Crown,
  ChevronRight,
  Ticket,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-1"
      title={label}
    >
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden />
      <span className="text-[11px] font-medium tabular-nums text-foreground">
        {value}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function MembersPage() {
  const crew = useQuery(api.users.listCrew);

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                  <Clapperboard className="h-4 w-4 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">The Crew</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                {crew === undefined
                  ? "Loading your cast list…"
                  : crew.length === 0
                    ? "Nobody here yet. Sign in and invite the group."
                    : `${crew.length} ${crew.length === 1 ? "person" : "people"} on the shared watchlist · open a profile for ratings and history`}
              </p>
            </div>
            {crew && crew.length > 0 ? (
              <div className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shrink-0">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
                    Cast size
                  </p>
                  <p className="text-sm font-semibold tabular-nums leading-none mt-0.5">
                    {crew.length}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {crew === undefined ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-6 w-14 rounded-md" />
                      <Skeleton className="h-6 w-14 rounded-md" />
                      <Skeleton className="h-6 w-14 rounded-md" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : crew.length === 0 ? (
          <EmptyState
            icon={UserRoundPlus}
            title="No crew members yet"
            description="Once people sign in, they show up here with ratings, suggestions, and nights hosted."
            actionLabel="Go to dashboard"
            actionHref="/"
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-0.5 pb-1">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
                Cast list
              </p>
              <div className="h-px flex-1 bg-border" />
            </div>

            <ul className="space-y-2">
              {crew.map((member, index) => {
                const avg =
                  member.avgRating !== null
                    ? member.avgRating.toFixed(1)
                    : "—";

                return (
                  <li key={member._id}>
                    <Link href={`/profile/${member._id}`} className="block group">
                      <Card className="shadow-sm hover:bg-accent/30 transition-colors">
                        <CardContent className="p-4 flex items-center gap-3 sm:gap-4">
                          <span className="hidden sm:block w-6 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums text-right">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 ring-1 ring-border">
                            <AvatarImage
                              src={member.avatar ?? member.image ?? undefined}
                            />
                            <AvatarFallback className="text-sm font-semibold bg-muted">
                              {member.name?.[0]?.toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium truncate text-sm sm:text-base group-hover:text-primary transition-colors">
                                {member.name ?? "Unknown"}
                              </p>
                              {member.isYou ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  You
                                </Badge>
                              ) : null}
                              {member.isOwner ? (
                                <Badge
                                  variant="outline"
                                  className="gap-1 text-[10px] border-amber-500/30 text-amber-700 dark:text-amber-400"
                                >
                                  <Crown className="h-3 w-3" />
                                  Owner
                                </Badge>
                              ) : null}
                            </div>

                            {member.bio ? (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {member.bio}
                              </p>
                            ) : member.email ? (
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            ) : null}

                            <div className="flex flex-wrap gap-1.5">
                              <StatChip
                                icon={Star}
                                label="Average rating"
                                value={avg}
                              />
                              <StatChip
                                icon={Clapperboard}
                                label="Ratings given"
                                value={String(member.ratingsGiven)}
                              />
                              <StatChip
                                icon={ListPlus}
                                label="Watchlist suggestions"
                                value={String(member.suggestions)}
                              />
                              <StatChip
                                icon={CalendarDays}
                                label="Nights hosted"
                                value={String(member.nightsHosted)}
                              />
                            </div>
                          </div>

                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
                              "group-hover:translate-x-0.5 group-hover:text-foreground",
                            )}
                          />
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}
