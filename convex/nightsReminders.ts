import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Schedule (or reschedule) a reminder ~24h before the night. */
export const scheduleReminder = internalMutation({
  args: {
    nightId: v.id("movie_nights"),
  },
  handler: async (ctx, { nightId }) => {
    const night = await ctx.db.get(nightId);
    if (!night || night.status === "done") return;

    if (night.reminderJobId) {
      try {
        await ctx.scheduler.cancel(night.reminderJobId);
      } catch {
        // Job may already have run
      }
    }

    const remindAt = night.date - DAY_MS;
    const now = Date.now();
    const runAt =
      remindAt > now
        ? remindAt
        : night.date - HOUR_MS > now
          ? night.date - HOUR_MS
          : now + 5_000;

    if (runAt >= night.date) return;

    const jobId = await ctx.scheduler.runAt(
      runAt,
      internal.nightsActions.sendReminder,
      { nightId },
    );

    await ctx.db.patch(nightId, { reminderJobId: jobId });
  },
});

export const markReminderSent = internalMutation({
  args: { nightId: v.id("movie_nights") },
  handler: async (ctx, { nightId }) => {
    await ctx.db.patch(nightId, {
      reminderSentAt: Date.now(),
      reminderJobId: undefined,
    });
  },
});

export const getNightForReminder = internalQuery({
  args: { nightId: v.id("movie_nights") },
  handler: async (ctx, { nightId }) => {
    const night = await ctx.db.get(nightId);
    if (!night || night.reminderSentAt || night.status === "done") {
      return null;
    }

    const attendees = await Promise.all(
      night.attendees.map((id) => ctx.db.get(id)),
    );
    const emails = attendees
      .map((u) => u?.email)
      .filter((e): e is string => !!e);

    const host = await ctx.db.get(night.hostId);

    return {
      title: night.title,
      date: night.date,
      emails,
      hostName: host?.name ?? "Your host",
      nightId,
    };
  },
});
