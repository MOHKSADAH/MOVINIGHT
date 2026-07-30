"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const sendReminder = internalAction({
  args: { nightId: v.id("movie_nights") },
  handler: async (ctx, { nightId }) => {
    const payload = await ctx.runQuery(
      internal.nightsReminders.getNightForReminder,
      { nightId },
    );
    if (!payload || payload.emails.length === 0) return;

    const apiKey = process.env.AUTH_RESEND_KEY;
    if (!apiKey) {
      console.error("AUTH_RESEND_KEY is not set; skipping night reminder");
      return;
    }

    const from =
      process.env.AUTH_RESEND_FROM ?? "Movie Night <onboarding@resend.dev>";
    const when = new Date(payload.date).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    });

    const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
    const nightUrl = `${siteUrl}/night/${nightId}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.emails,
        subject: `Movie night tomorrow: ${payload.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px">Movie Night</h2>
            <p style="color:#666;margin:0 0 16px">Reminder from ${payload.hostName}</p>
            <p style="margin:0 0 8px"><strong>${payload.title}</strong></p>
            <p style="margin:0 0 24px">${when}</p>
            <p style="margin:0 0 24px">
              <a href="${nightUrl}" style="background:#c23;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">
                Open night
              </a>
            </p>
            <p style="color:#999;font-size:12px;margin:0">See you on the couch.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Failed to send night reminder:", body);
      return;
    }

    await ctx.runMutation(internal.nightsReminders.markReminderSent, {
      nightId,
    });
  },
});
