"use client";

import { Fragment, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Eye,
  ListPlus,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/empty-state";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import {
  useFormatActivityItem,
  type ActivityItem,
} from "@/lib/format-activity";

const TYPE_META: Record<
  ActivityItem["type"],
  { icon: LucideIcon; media: string }
> = {
  watchlist_add: {
    icon: ListPlus,
    media: "border-primary/30 bg-primary/10 text-primary",
  },
  watched: {
    icon: Eye,
    media:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  rating: {
    icon: Star,
    media:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  night: {
    icon: CalendarDays,
    media: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
};

type DayBucket = "today" | "yesterday" | "earlier";

function dayBucket(at: number, now: number): DayBucket {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (at >= startOfToday.getTime()) return "today";
  if (at >= startOfYesterday.getTime()) return "yesterday";
  return "earlier";
}

function ActivityDayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1" role="separator">
      <Separator className="flex-1" />
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <Separator className="flex-1" />
    </div>
  );
}

export function ActivityFeed({
  items,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  now,
}: {
  items: ActivityItem[] | undefined;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  now?: number;
}) {
  const t = useTranslations("common");
  const formatActivity = useFormatActivityItem();
  const [fallbackNow] = useState(() => Date.now());
  const effectiveNow = now ?? fallbackNow;

  const groups = useMemo(() => {
    if (!items?.length) return [];

    const order: DayBucket[] = ["today", "yesterday", "earlier"];
    const buckets: Record<DayBucket, ActivityItem[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    for (const item of items) {
      buckets[dayBucket(item.at, effectiveNow)].push(item);
    }

    return order
      .filter((key) => buckets[key].length > 0)
      .map((key) => ({
        key,
        label:
          key === "today"
            ? t("activityToday")
            : key === "yesterday"
              ? t("activityYesterday")
              : t("activityEarlier"),
        items: buckets[key],
      }));
  }, [items, effectiveNow, t]);

  if (items === undefined) {
    return (
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        compact
      />
    );
  }

  const showDividers = groups.length > 1;

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
        <Fragment key={group.key}>
          {showDividers ? <ActivityDayDivider label={group.label} /> : null}
          {group.items.map((item) => {
            const formatted = formatActivity(item);
            const meta = TYPE_META[item.type];
            const Icon = meta.icon;

            return (
              <Item
                key={item.id}
                asChild
                variant="outline"
                size="sm"
                className="bg-card shadow-sm"
              >
                <Link href={item.href}>
                  <ItemMedia variant="icon" className={cn(meta.media)}>
                    <Icon />
                  </ItemMedia>
                  <ItemContent className="min-w-0 gap-0.5 text-start">
                    <ItemTitle
                      className="w-full min-w-0 max-w-full truncate"
                      dir="auto"
                    >
                      {formatted.title}
                    </ItemTitle>
                    {formatted.subtitle ? (
                      <ItemDescription
                        className="line-clamp-1 text-xs"
                        dir="auto"
                      >
                        {formatted.subtitle}
                      </ItemDescription>
                    ) : null}
                  </ItemContent>
                  <ItemActions>
                    <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                  </ItemActions>
                </Link>
              </Item>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
