"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

function partsUntil(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return { days, hours, minutes, done: diff === 0 };
}

let clientNow = 0;
const listeners = new Set<() => void>();

function subscribeCountdown(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  if (clientNow === 0) {
    clientNow = Date.now();
  }
  const id = window.setInterval(() => {
    clientNow = Date.now();
    listeners.forEach((listener) => listener());
  }, 30_000);
  return () => {
    listeners.delete(onStoreChange);
    window.clearInterval(id);
  };
}

function getCountdownSnapshot() {
  return clientNow || Date.now();
}

function getCountdownServerSnapshot() {
  return 0;
}

export function NightCountdown({
  targetMs,
  className,
}: {
  targetMs: number;
  className?: string;
}) {
  const t = useTranslations("nights");
  const now = useSyncExternalStore(
    subscribeCountdown,
    getCountdownSnapshot,
    getCountdownServerSnapshot,
  );

  if (now === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        {t("countingDown")}
      </p>
    );
  }

  const { days, hours, minutes, done } = partsUntil(targetMs, now);

  if (done) {
    return (
      <p className={cn("text-sm font-medium text-primary", className)}>
        {t("isNightTime")}
      </p>
    );
  }

  const daysPart = days > 0 ? `${days}d ` : "";

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      <span className="font-medium text-foreground tabular-nums">
        {t("countdownFormat", { daysPart, hours, minutes })}
      </span>{" "}
      {t("untilShowtime")}
    </p>
  );
}
