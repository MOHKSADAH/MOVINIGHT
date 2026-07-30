import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const [watchlist, watched, nights] = await Promise.all([
      ctx.db.query("watchlist_entries").collect(),
      ctx.db.query("watched_entries").order("desc").take(40),
      ctx.db.query("movie_nights").order("desc").take(20),
    ]);

    type Activity = {
      id: string;
      type: "watchlist_add" | "watched" | "rating" | "night";
      at: number;
      title: string;
      subtitle: string;
      href: string;
    };

    const items: Activity[] = [];

    for (const entry of watchlist) {
      const [movie, user] = await Promise.all([
        ctx.db.get(entry.movieId),
        ctx.db.get(entry.addedBy),
      ]);
      if (!movie) continue;
      items.push({
        id: `wl-${entry._id}`,
        type: "watchlist_add",
        at: entry.addedAt,
        title: `${user?.name ?? "Someone"} added ${movie.title}`,
        subtitle: "to the watchlist",
        href: "/watchlist",
      });
    }

    for (const entry of watched) {
      const movie = await ctx.db.get(entry.movieId);
      if (!movie) continue;
      items.push({
        id: `w-${entry._id}`,
        type: "watched",
        at: entry.watchedAt,
        title: `Logged ${movie.title}`,
        subtitle:
          entry.ratings.length > 0
            ? `${entry.ratings.length} rating${entry.ratings.length === 1 ? "" : "s"}`
            : "waiting on ratings",
        href: "/watched",
      });

      for (const r of entry.ratings) {
        if (!r.note) continue;
        const user = await ctx.db.get(r.userId);
        items.push({
          id: `r-${entry._id}-${r.userId}`,
          type: "rating",
          at: entry.watchedAt,
          title: `${user?.name ?? "Someone"} rated ${movie.title} ${r.score}/10`,
          subtitle: r.note,
          href: "/watched",
        });
      }
    }

    for (const night of nights) {
      items.push({
        id: `n-${night._id}`,
        type: "night",
        at: night._creationTime,
        title: night.title,
        subtitle: `Movie night · ${night.status}`,
        href: `/night/${night._id}`,
      });
    }

    return items.sort((a, b) => b.at - a.at).slice(0, limit);
  },
});
