import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveUser, requireActiveUser } from "./lib/users";
import {
  CURATED_COLLECTIONS,
  seedMovieToDoc,
} from "./lib/seedCollections";
import type { Id } from "./_generated/dataModel";

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

/**
 * Idempotent seed of curated themed collections for APP_OWNER_EMAIL.
 * Creates missing collections, upserts/patches movies by tmdbId (fixes posters),
 * and syncs each curated collection's movie membership to the catalog.
 *
 * npx convex run collections:seedCuratedCollections
 */
export const seedCuratedCollections = internalMutation({
  args: {},
  returns: v.object({
    collectionsCreated: v.number(),
    collectionsSkipped: v.number(),
    moviesUpserted: v.number(),
    moviesPatched: v.number(),
    moviesLinked: v.number(),
    moviesUnlinked: v.number(),
  }),
  handler: async (ctx) => {
    const ownerEmail = process.env.APP_OWNER_EMAIL;
    if (!ownerEmail) {
      throw new Error("APP_OWNER_EMAIL is not set — cannot attribute seed rows");
    }

    const owner = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", ownerEmail))
      .unique();
    if (!owner || owner.deletedAt !== undefined) {
      throw new Error(
        `Owner user not found for ${ownerEmail}. Sign in as the owner once first.`,
      );
    }

    const existingOwned = await ctx.db
      .query("collections")
      .withIndex("by_owner", (q) => q.eq("ownerId", owner._id))
      .collect();
    const idByName = new Map(
      existingOwned.map((c) => [c.name.toLowerCase(), c._id] as const),
    );

    let collectionsCreated = 0;
    let collectionsSkipped = 0;
    let moviesUpserted = 0;
    let moviesPatched = 0;
    let moviesLinked = 0;
    let moviesUnlinked = 0;
    const now = Date.now();

    for (const curated of CURATED_COLLECTIONS) {
      const nameKey = curated.name.toLowerCase();
      let collectionId = idByName.get(nameKey);
      if (collectionId) {
        collectionsSkipped += 1;
        const existingCol = existingOwned.find((c) => c._id === collectionId);
        if (
          existingCol &&
          existingCol.description !== curated.description
        ) {
          await ctx.db.patch(collectionId, {
            description: curated.description,
          });
        }
      } else {
        collectionId = await ctx.db.insert("collections", {
          name: curated.name,
          description: curated.description,
          ownerId: owner._id,
          createdAt: now,
        });
        idByName.set(nameKey, collectionId);
        collectionsCreated += 1;
      }

      const desiredMovieIds = new Set<Id<"movies">>();

      for (const seedMovie of curated.movies) {
        const doc = seedMovieToDoc(seedMovie);
        const existingMovie = await ctx.db
          .query("movies")
          .withIndex("by_tmdbId", (q) => q.eq("tmdbId", doc.tmdbId))
          .first();

        let movieId: Id<"movies">;
        if (existingMovie) {
          movieId = existingMovie._id;
          const patch: {
            title?: string;
            poster?: string;
            overview?: string;
            genres?: string[];
            runtime?: number;
            releaseYear?: number;
            imdbRating?: number;
          } = {};
          if (existingMovie.poster !== doc.poster) patch.poster = doc.poster;
          if (existingMovie.title !== doc.title) patch.title = doc.title;
          if (existingMovie.overview !== doc.overview) {
            patch.overview = doc.overview;
          }
          if (
            JSON.stringify(existingMovie.genres) !== JSON.stringify(doc.genres)
          ) {
            patch.genres = doc.genres;
          }
          if (doc.runtime !== undefined && existingMovie.runtime !== doc.runtime) {
            patch.runtime = doc.runtime;
          }
          if (existingMovie.releaseYear !== doc.releaseYear) {
            patch.releaseYear = doc.releaseYear;
          }
          if (
            doc.imdbRating !== undefined &&
            existingMovie.imdbRating !== doc.imdbRating
          ) {
            patch.imdbRating = doc.imdbRating;
          }
          if (Object.keys(patch).length > 0) {
            await ctx.db.patch(movieId, patch);
            moviesPatched += 1;
          }
        } else {
          movieId = await ctx.db.insert("movies", doc);
          moviesUpserted += 1;
        }
        desiredMovieIds.add(movieId);

        const link = await ctx.db
          .query("collection_movies")
          .withIndex("by_collection_movie", (q) =>
            q.eq("collectionId", collectionId).eq("movieId", movieId),
          )
          .first();
        if (!link) {
          await ctx.db.insert("collection_movies", {
            collectionId,
            movieId,
            addedBy: owner._id,
            addedAt: now,
          });
          moviesLinked += 1;
        }
      }

      // Drop stale links so wrong TMDB ids from earlier seeds disappear.
      const currentLinks = await ctx.db
        .query("collection_movies")
        .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
        .collect();
      for (const link of currentLinks) {
        if (!desiredMovieIds.has(link.movieId)) {
          await ctx.db.delete(link._id);
          moviesUnlinked += 1;
        }
      }
    }

    return {
      collectionsCreated,
      collectionsSkipped,
      moviesUpserted,
      moviesPatched,
      moviesLinked,
      moviesUnlinked,
    };
  },
});
