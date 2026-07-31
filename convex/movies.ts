import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireActiveUser } from "./lib/users";

export const upsertMovie = mutation({
  args: {
    tmdbId: v.number(),
    title: v.string(),
    titleAr: v.optional(v.string()),
    poster: v.string(),
    backdrop: v.optional(v.string()),
    overview: v.string(),
    overviewAr: v.optional(v.string()),
    genres: v.array(v.string()),
    runtime: v.optional(v.number()),
    releaseYear: v.number(),
    imdbRating: v.optional(v.number()),
    imdbVotes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireActiveUser(ctx);

    const existing = await ctx.db
      .query("movies")
      .withIndex("by_tmdbId", (q) => q.eq("tmdbId", args.tmdbId))
      .first();

    if (existing) {
      const patch: {
        titleAr?: string;
        overviewAr?: string;
      } = {};
      if (!existing.titleAr && args.titleAr) patch.titleAr = args.titleAr;
      if (!existing.overviewAr && args.overviewAr) {
        patch.overviewAr = args.overviewAr;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("movies", args);
  },
});

export const getMovieById = query({
  args: { movieId: v.id("movies") },
  handler: async (ctx, { movieId }) => {
    return await ctx.db.get(movieId);
  },
});

export const getMovieByTmdbId = query({
  args: { tmdbId: v.number() },
  handler: async (ctx, { tmdbId }) => {
    return await ctx.db
      .query("movies")
      .withIndex("by_tmdbId", (q) => q.eq("tmdbId", tmdbId))
      .first();
  },
});
