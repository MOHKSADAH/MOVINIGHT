import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveUser, requireActiveUser } from "./lib/users";

export const getWatchlist = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await getActiveUser(ctx))?._id;
    if (!userId) return [];

    // Collect all watched movieIds to exclude from watchlist
    const watchedEntries = await ctx.db.query("watched_entries").collect();
    const watchedMovieIds = new Set(watchedEntries.map((e) => e.movieId));

    const entries = await ctx.db.query("watchlist_entries").collect();
    const enriched = await Promise.all(
      entries
        .filter((entry) => !watchedMovieIds.has(entry.movieId))
        .map(async (entry) => {
          const [movie, addedBy] = await Promise.all([
            ctx.db.get(entry.movieId),
            ctx.db.get(entry.addedBy),
          ]);
          return { ...entry, movie, addedBy };
        }),
    );
    return enriched
      .filter((e) => e.movie !== null)
      .sort((a, b) => b.upvotes.length - a.upvotes.length);
  },
});

export const addToWatchlist = mutation({
  args: {
    movieId: v.id("movies"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { movieId, note }) => {
    const userId = (await requireActiveUser(ctx))._id;

    const existing = await ctx.db
      .query("watchlist_entries")
      .withIndex("by_movie", (q) => q.eq("movieId", movieId))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("watchlist_entries", {
      movieId,
      addedBy: userId,
      addedAt: Date.now(),
      upvotes: [],
      note,
    });
  },
});

export const toggleUpvote = mutation({
  args: { entryId: v.id("watchlist_entries") },
  handler: async (ctx, { entryId }) => {
    const userId = (await requireActiveUser(ctx))._id;

    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Entry not found");

    const hasUpvoted = entry.upvotes.includes(userId);
    await ctx.db.patch(entryId, {
      upvotes: hasUpvoted
        ? entry.upvotes.filter((id) => id !== userId)
        : [...entry.upvotes, userId],
    });
  },
});

export const toggleDownvote = mutation({
  args: { entryId: v.id("watchlist_entries") },
  handler: async (ctx, { entryId }) => {
    const userId = (await requireActiveUser(ctx))._id;

    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Entry not found");

    const downvotes = entry.downvotes ?? [];
    const hasDownvoted = downvotes.includes(userId);
    await ctx.db.patch(entryId, {
      downvotes: hasDownvoted
        ? downvotes.filter((id) => id !== userId)
        : [...downvotes, userId],
    });
  },
});

export const removeFromWatchlist = mutation({
  args: { entryId: v.id("watchlist_entries") },
  handler: async (ctx, { entryId }) => {
    await requireActiveUser(ctx);
    await ctx.db.delete(entryId);
  },
});

export const getWatchlistCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await getActiveUser(ctx))?._id;
    if (!userId) return 0;
    const entries = await ctx.db.query("watchlist_entries").collect();
    return entries.length;
  },
});
