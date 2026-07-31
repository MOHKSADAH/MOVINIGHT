import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveUser, requireActiveUser } from "./lib/users";

export const getCollections = query({
  args: {},
  handler: async (ctx) => {
    const userId = (await getActiveUser(ctx))?._id;
    if (!userId) return [];

    const collections = await ctx.db.query("collections").collect();
    return Promise.all(
      collections
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(async (c) => {
          const [owner, entries] = await Promise.all([
            ctx.db.get(c.ownerId),
            ctx.db
              .query("collection_movies")
              .withIndex("by_collection", (q) => q.eq("collectionId", c._id))
              .collect(),
          ]);
          const firstThree = entries.slice(0, 3);
          const posters = (
            await Promise.all(firstThree.map((e) => ctx.db.get(e.movieId)))
          )
            .filter(Boolean)
            .map((m) => m!.poster);
          return {
            ...c,
            ownerName: owner?.name ?? "Unknown",
            movieCount: entries.length,
            posters,
            isOwner: c.ownerId === userId,
          };
        }),
    );
  },
});

export const getCollection = query({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, { collectionId }) => {
    const userId = (await getActiveUser(ctx))?._id;
    if (!userId) return null;

    const collection = await ctx.db.get(collectionId);
    if (!collection) return null;

    const [owner, entries] = await Promise.all([
      ctx.db.get(collection.ownerId),
      ctx.db
        .query("collection_movies")
        .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
        .collect(),
    ]);

    const movies = (
      await Promise.all(
        entries.map(async (e) => {
          const movie = await ctx.db.get(e.movieId);
          return movie ? { entryId: e._id, addedAt: e.addedAt, movie } : null;
        }),
      )
    ).filter(Boolean) as { entryId: string; addedAt: number; movie: NonNullable<unknown> }[];

    return {
      ...collection,
      ownerName: owner?.name ?? "Unknown",
      isOwner: collection.ownerId === userId,
      movies,
    };
  },
});

export const createCollection = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await requireActiveUser(ctx))._id;
    return await ctx.db.insert("collections", {
      name: args.name,
      description: args.description,
      ownerId: userId,
      createdAt: Date.now(),
    });
  },
});

export const deleteCollection = mutation({
  args: { collectionId: v.id("collections") },
  handler: async (ctx, { collectionId }) => {
    const userId = (await requireActiveUser(ctx))._id;

    const collection = await ctx.db.get(collectionId);
    if (!collection || collection.ownerId !== userId)
      throw new Error("Not authorized");

    const entries = await ctx.db
      .query("collection_movies")
      .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
      .collect();
    await Promise.all(entries.map((e) => ctx.db.delete(e._id)));
    await ctx.db.delete(collectionId);
  },
});

export const addMovieToCollection = mutation({
  args: {
    collectionId: v.id("collections"),
    movieId: v.id("movies"),
  },
  handler: async (ctx, args) => {
    const userId = (await requireActiveUser(ctx))._id;

    const existing = await ctx.db
      .query("collection_movies")
      .withIndex("by_collection_movie", (q) =>
        q.eq("collectionId", args.collectionId).eq("movieId", args.movieId),
      )
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("collection_movies", {
      collectionId: args.collectionId,
      movieId: args.movieId,
      addedBy: userId,
      addedAt: Date.now(),
    });
  },
});

export const removeMovieFromCollection = mutation({
  args: { entryId: v.id("collection_movies") },
  handler: async (ctx, { entryId }) => {
    await requireActiveUser(ctx);
    await ctx.db.delete(entryId);
  },
});
