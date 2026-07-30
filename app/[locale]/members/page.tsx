"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, UserRoundPlus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-start">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums tracking-tight text-foreground">
        {value}
      </span>
    </div>
  );
}

export default function MembersPage() {
  const t = useTranslations("members");
  const tEmpty = useTranslations("empty");
  const tCommon = useTranslations("common");
  const crew = useQuery(api.users.listCrew);

  return (
    <AppShell>
      <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
        <header className="flex items-end justify-between gap-4">
          <div className="min-w-0 flex-1 text-start">
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {crew === undefined
                ? t("loadingCast")
                : crew.length === 0
                  ? t("emptyInvite")
                  : t("crewSummary", {
                      count: crew.length,
                      peopleLabel:
                        crew.length === 1
                          ? tCommon("person")
                          : tCommon("people"),
                    })}
            </p>
          </div>
          {crew && crew.length > 0 ? (
            <div className="hidden shrink-0 text-end sm:block">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("castSize")}
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {crew.length}
              </p>
            </div>
          ) : null}
        </header>

        {crew === undefined ? (
          <div className="flex flex-col gap-0">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 border-b border-border py-5"
              >
                <Skeleton className="hidden h-3 w-5 sm:block" />
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="mt-1 h-8 w-full max-w-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : crew.length === 0 ? (
          <EmptyState
            icon={UserRoundPlus}
            title={tEmpty("noCrewTitle")}
            description={tEmpty("noCrewDesc")}
            actionLabel={tEmpty("goToDashboardAction")}
            actionHref="/"
          />
        ) : (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <p className="shrink-0 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("castList")}
              </p>
              <div className="h-px flex-1 bg-border" />
            </div>

            <ul className="flex flex-col">
              {crew.map((member, index) => {
                const avg =
                  member.avgRating !== null
                    ? member.avgRating.toFixed(1)
                    : "—";
                const roleBits = [
                  member.isYou ? tCommon("you") : null,
                  member.isOwner ? tCommon("owner") : null,
                ].filter(Boolean);

                return (
                  <li key={member._id}>
                    <Link
                      href={`/profile/${member._id}`}
                      className={cn(
                        "group flex items-center gap-3 border-b border-border py-5 transition-colors sm:gap-5",
                        "hover:bg-muted/30 -mx-2 rounded-md px-2 sm:-mx-3 sm:px-3",
                      )}
                    >
                      <span className="hidden w-6 shrink-0 text-end font-mono text-[11px] tabular-nums text-muted-foreground sm:block">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <Avatar className="size-12 shrink-0 sm:size-14">
                        <AvatarImage
                          src={member.avatar ?? member.image ?? undefined}
                        />
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {member.name?.[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <div className="min-w-0 text-start">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <p
                              className="truncate text-sm font-semibold tracking-tight uppercase sm:text-[15px]"
                              dir="auto"
                            >
                              {member.name ?? tCommon("unknown")}
                            </p>
                            {roleBits.length > 0 ? (
                              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                {roleBits.join(" · ")}
                              </span>
                            ) : null}
                          </div>
                          {member.bio ? (
                            <p
                              className="mt-0.5 line-clamp-1 text-xs text-muted-foreground"
                              dir="auto"
                            >
                              {member.bio}
                            </p>
                          ) : member.email ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-4 gap-2 sm:max-w-md sm:gap-4">
                          <MetaStat label={t("statAvgShort")} value={avg} />
                          <MetaStat
                            label={t("statRatedShort")}
                            value={String(member.ratingsGiven)}
                          />
                          <MetaStat
                            label={t("statAddedShort")}
                            value={String(member.suggestions)}
                          />
                          <MetaStat
                            label={t("statHostedShort")}
                            value={String(member.nightsHosted)}
                          />
                        </div>
                      </div>

                      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
