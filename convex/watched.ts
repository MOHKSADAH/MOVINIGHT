import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveUser, requireActiveUser, requireAppOwner } from "./lib/users";

export const getWatchedEntries = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await getActiveUser(ctx))?._id;
    if (!userId) return [];

    const entries = await ctx.db
      .query("watched_entries")
      .order("desc")
      .collect();

    return Promise.all(
      entries.map(async (entry) => {
        const movie = await ctx.db.get(entry.movieId);
        return { ...entry, movie };
      }),
    );
  },
});

export const addWatchedEntry = mutation({
  args: {
    movieId: v.id("movies"),
    nightId: v.optional(v.id("movie_nights")),
    pickedBy: v.optional(v.id("users")),
    watchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await requireActiveUser(ctx);

    const watchlistEntry = await ctx.db
      .query("watchlist_entries")
      .withIndex("by_movie", (q) => q.eq("movieId", args.movieId))
      .first();

    const suggestedBy = watchlistEntry
      ? [
          ...new Set([
            watchlistEntry.addedBy,
            ...watchlistEntry.upvotes,
            ...(args.pickedBy ? [args.pickedBy] : []),
          ]),
        ]
      : args.pickedBy
        ? [args.pickedBy]
        : undefined;

    const entryId = await ctx.db.insert("watched_entries", {
      movieId: args.movieId,
      nightId: args.nightId,
      pickedBy: args.pickedBy,
      suggestedBy,
      watchedAt: args.watchedAt,
      ratings: [],
    });

    if (watchlistEntry) {
      await ctx.db.delete(watchlistEntry._id);
    }

    return entryId;
  },
});

export const addRating = mutation({
  args: {
    entryId: v.id("watched_entries"),
    score: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { entryId, score, note }) => {
    const userId = (await requireActiveUser(ctx))._id;

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error("Rating must be a whole number from 1 to 5");
    }

    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Entry not found");

    const ratings = entry.ratings.filter((r) => r.userId !== userId);
    ratings.push({ userId, score, note });

    await ctx.db.patch(entryId, { ratings });
  },
});

export const getWatchedCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await getActiveUser(ctx))?._id;
    if (!userId) return 0;
    const entries = await ctx.db.query("watched_entries").collect();
    return entries.length;
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const caller = await getActiveUser(ctx);
    if (!caller) return null;

    const entries = await ctx.db.query("watched_entries").collect();
    const userRatings = entries.flatMap((e) =>
      e.ratings.filter((r) => r.userId === userId),
    );

    return {
      moviesWatched: entries.length,
      ratingsGiven: userRatings.length,
      avgRating:
        userRatings.length > 0
          ? userRatings.reduce((sum, r) => sum + r.score, 0) /
            userRatings.length
          : 0,
    };
  },
});

export const deleteWatchedEntry = mutation({
  args: { entryId: v.id("watched_entries") },
  handler: async (ctx, { entryId }) => {
    await requireAppOwner(ctx);
    await ctx.db.delete(entryId);
  },
});

export const getRecentWatched = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 5 }) => {
    const userId = (await getActiveUser(ctx))?._id;
    if (!userId) return [];

    const entries = await ctx.db
      .query("watched_entries")
      .order("desc")
      .take(limit);

    return Promise.all(
      entries.map(async (entry) => {
        const movie = await ctx.db.get(entry.movieId);
        return { ...entry, movie };
      }),
    );
  },
});
