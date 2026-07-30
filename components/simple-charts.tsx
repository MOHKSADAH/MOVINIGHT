"use client";

import { cn } from "@/lib/utils";

type Bar = { label: string; value: number };

export function SimpleBarChart({
  data,
  emptyLabel = "No data yet",
  className,
}: {
  data: Bar[];
  emptyLabel?: string;
  className?: string;
}) {
  const max = Math.max(0, ...data.map((d) => d.value));

  if (data.length === 0 || max === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={cn("flex items-end gap-1.5 h-36", className)}>
      {data.map((d) => {
        const height = Math.max(4, Math.round((d.value / max) * 100));
        return (
          <div
            key={d.label}
            className="flex-1 min-w-0 flex flex-col items-center gap-1 h-full justify-end"
          >
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {d.value || ""}
            </span>
            <div
              className="w-full rounded-t-sm bg-primary/80"
              style={{ height: `${height}%` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SimpleHorizontalBars({
  data,
  emptyLabel = "No data yet",
}: {
  data: Bar[];
  emptyLabel?: string;
}) {
  const max = Math.max(0, ...data.map((d) => d.value));

  if (data.length === 0 || max === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="space-y-1">
          <div className="flex justify-between text-xs gap-2">
            <span className="truncate">{d.label}</span>
            <span className="text-muted-foreground tabular-nums shrink-0">
              {d.value}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/80"
              style={{ width: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
