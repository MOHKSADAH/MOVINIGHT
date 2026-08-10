import { query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveOrgContext } from "./lib/customFunctions";

const activityItemValidator = v.object({
  id: v.string(),
  type: v.union(
    v.literal("watchlist_add"),
    v.literal("watched"),
    v.literal("rating"),
    v.literal("night"),
  ),
  at: v.number(),
  href: v.string(),
  actorName: v.optional(v.string()),
  movieTitle: v.optional(v.string()),
  movieTitleAr: v.optional(v.string()),
  score: v.optional(v.number()),
  note: v.optional(v.string()),
  ratingCount: v.optional(v.number()),
  nightTitle: v.optional(v.string()),
  nightStatus: v.optional(v.string()),
});

export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(activityItemValidator),
  handler: async (ctx, { limit = 12 }) => {
    const orgCtx = await getActiveOrgContext(ctx);
    if (!orgCtx) return [];

    const [watchlist, watched, nights] = await Promise.all([
      ctx.db
        .query("watchlist_entries")
        .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
        .collect(),
      ctx.db
        .query("watched_entries")
        .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
        .order("desc")
        .take(40),
      ctx.db
        .query("movie_nights")
        .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
        .order("desc")
        .take(20),
    ]);

    type Activity = {
      id: string;
      type: "watchlist_add" | "watched" | "rating" | "night";
      at: number;
      href: string;
      actorName?: string;
      movieTitle?: string;
      movieTitleAr?: string;
      score?: number;
      note?: string;
      ratingCount?: number;
      nightTitle?: string;
      nightStatus?: string;
    };

    const items: Activity[] = [];

    const watchlistMovieIds = [
      ...new Set(watchlist.map((entry) => entry.movieId)),
    ];
    const watchlistUserIds = [
      ...new Set(watchlist.map((entry) => entry.addedBy)),
    ];
    const [watchlistMovies, watchlistUsers] = await Promise.all([
      Promise.all(watchlistMovieIds.map((id) => ctx.db.get(id))),
      Promise.all(watchlistUserIds.map((id) => ctx.db.get(id))),
    ]);
    const movieById = new Map<
      NonNullable<(typeof watchlistMovies)[number]>["_id"],
      NonNullable<(typeof watchlistMovies)[number]>
    >();
    for (const m of watchlistMovies) {
      if (m) movieById.set(m._id, m);
    }
    const userById = new Map<
      NonNullable<(typeof watchlistUsers)[number]>["_id"],
      NonNullable<(typeof watchlistUsers)[number]>
    >();
    for (const u of watchlistUsers) {
      if (u) userById.set(u._id, u);
    }

    for (const entry of watchlist) {
      const movie = movieById.get(entry.movieId);
      if (!movie) continue;
      const user = userById.get(entry.addedBy);
      items.push({
        id: `wl-${entry._id}`,
        type: "watchlist_add",
        at: entry.addedAt,
        href: "/watchlist",
        actorName: user?.name,
        movieTitle: movie.title,
        movieTitleAr: movie.titleAr,
      });
    }

    const watchedMovieIds = [
      ...new Set(watched.map((entry) => entry.movieId)),
    ];
    const ratingNoteUserIds = new Set<
      (typeof watched)[number]["ratings"][number]["userId"]
    >();
    for (const entry of watched) {
      for (const r of entry.ratings) {
        if (r.note) ratingNoteUserIds.add(r.userId);
      }
    }
    const [watchedMovies, ratingNoteUsers] = await Promise.all([
      Promise.all(watchedMovieIds.map((id) => ctx.db.get(id))),
      Promise.all([...ratingNoteUserIds].map((id) => ctx.db.get(id))),
    ]);
    const watchedMovieById = new Map<
      NonNullable<(typeof watchedMovies)[number]>["_id"],
      NonNullable<(typeof watchedMovies)[number]>
    >();
    for (const m of watchedMovies) {
      if (m) watchedMovieById.set(m._id, m);
    }
    const ratingUserById = new Map<
      NonNullable<(typeof ratingNoteUsers)[number]>["_id"],
      NonNullable<(typeof ratingNoteUsers)[number]>
    >();
    for (const u of ratingNoteUsers) {
      if (u) ratingUserById.set(u._id, u);
    }

    for (const entry of watched) {
      const movie = watchedMovieById.get(entry.movieId);
      if (!movie) continue;
      items.push({
        id: `w-${entry._id}`,
        type: "watched",
        at: entry.watchedAt,
        href: "/watched",
        movieTitle: movie.title,
        movieTitleAr: movie.titleAr,
        ratingCount: entry.ratings.length,
      });

      for (const r of entry.ratings) {
        if (!r.note) continue;
        const user = ratingUserById.get(r.userId);
        items.push({
          id: `r-${entry._id}-${r.userId}`,
          type: "rating",
          at: entry.watchedAt,
          href: "/watched",
          actorName: user?.name,
          movieTitle: movie.title,
          movieTitleAr: movie.titleAr,
          score: r.score,
          note: r.note,
        });
      }
    }

    for (const night of nights) {
      items.push({
        id: `n-${night._id}`,
        type: "night",
        at: night._creationTime,
        href: `/night/${night._id}`,
        nightTitle: night.title,
        nightStatus: night.status,
      });
    }

    return items.sort((a, b) => b.at - a.at).slice(0, limit);
  },
});
