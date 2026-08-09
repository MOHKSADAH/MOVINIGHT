import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  getActiveOrgContext,
  requireActiveOrgContext,
} from "./lib/customFunctions";
import { assertOrgAccessible } from "./lib/orgs";

export const getWatchlist = query({
  args: {},
  handler: async (ctx) => {
    const orgCtx = await getActiveOrgContext(ctx);
    if (!orgCtx) return [];

    const watchedEntries = await ctx.db
      .query("watched_entries")
      .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
      .collect();
    const watchedMovieIds = new Set(watchedEntries.map((e) => e.movieId));

    const entries = await ctx.db
      .query("watchlist_entries")
      .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
      .collect();

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
    const { user, orgId } = await requireActiveOrgContext(ctx);

    const existing = await ctx.db
      .query("watchlist_entries")
      .withIndex("by_org_and_movie", (q) =>
        q.eq("orgId", orgId).eq("movieId", movieId),
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("watchlist_entries", {
      orgId,
      movieId,
      addedBy: user._id,
      addedAt: Date.now(),
      upvotes: [],
      note,
    });
  },
});

export const toggleUpvote = mutation({
  args: { entryId: v.id("watchlist_entries") },
  handler: async (ctx, { entryId }) => {
    const { user, orgId } = await requireActiveOrgContext(ctx);
    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Entry not found");
    await assertOrgAccessible(ctx, user._id, entry.orgId ?? orgId);
    if (entry.orgId && entry.orgId !== orgId) {
      throw new Error("Entry belongs to another organization");
    }

    const hasUpvoted = entry.upvotes.includes(user._id);
    await ctx.db.patch(entryId, {
      upvotes: hasUpvoted
        ? entry.upvotes.filter((id) => id !== user._id)
        : [...entry.upvotes, user._id],
    });
  },
});

export const toggleDownvote = mutation({
  args: { entryId: v.id("watchlist_entries") },
  handler: async (ctx, { entryId }) => {
    const { user, orgId } = await requireActiveOrgContext(ctx);
    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.orgId && entry.orgId !== orgId) {
      throw new Error("Entry belongs to another organization");
    }

    const downvotes = entry.downvotes ?? [];
    const hasDownvoted = downvotes.includes(user._id);
    await ctx.db.patch(entryId, {
      downvotes: hasDownvoted
        ? downvotes.filter((id) => id !== user._id)
        : [...downvotes, user._id],
    });
  },
});

export const removeFromWatchlist = mutation({
  args: { entryId: v.id("watchlist_entries") },
  handler: async (ctx, { entryId }) => {
    const { orgId } = await requireActiveOrgContext(ctx);
    const entry = await ctx.db.get(entryId);
    if (!entry) throw new Error("Entry not found");
    if (entry.orgId && entry.orgId !== orgId) {
      throw new Error("Entry belongs to another organization");
    }
    await ctx.db.delete(entryId);
  },
});

export const getWatchlistCount = query({
  args: {},
  handler: async (ctx) => {
    const orgCtx = await getActiveOrgContext(ctx);
    if (!orgCtx) return 0;
    const entries = await ctx.db
      .query("watchlist_entries")
      .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
      .collect();
    return entries.length;
  },
});
