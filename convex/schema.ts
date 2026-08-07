import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    // Fields required by @convex-dev/auth (all optional)
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // App-specific fields
    /** Resolved image URL: an uploaded file, a `/avatars/*.svg` preset, or an OAuth picture. */
    avatar: v.optional(v.string()),
    /** Set only for uploads, so the old file can be removed when the avatar changes. */
    avatarStorageId: v.optional(v.id("_storage")),
    bio: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    /** Set when the account is deleted; the row is kept so shared history stays intact. */
    deletedAt: v.optional(v.number()),
  }).index("email", ["email"]),

  movies: defineTable({
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
  }).index("by_tmdbId", ["tmdbId"]),

  watchlist_entries: defineTable({
    movieId: v.id("movies"),
    addedBy: v.id("users"),
    addedAt: v.number(),
    upvotes: v.array(v.id("users")),
    downvotes: v.optional(v.array(v.id("users"))),
    note: v.optional(v.string()),
  }).index("by_movie", ["movieId"]),

  movie_nights: defineTable({
    title: v.string(),
    date: v.number(),
    hostId: v.id("users"),
    status: v.union(
      v.literal("upcoming"),
      v.literal("active"),
      v.literal("done"),
    ),
    attendees: v.array(v.id("users")),
    candidates: v.array(v.id("movies")),
    pickedMovie: v.optional(v.id("movies")),
    reminderJobId: v.optional(v.id("_scheduled_functions")),
    reminderSentAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_date", ["date"]),

  watched_entries: defineTable({
    movieId: v.id("movies"),
    nightId: v.optional(v.id("movie_nights")),
    pickedBy: v.optional(v.id("users")),
    /** Snapshot of who pushed this film (addedBy + upvoters) before watchlist removal */
    suggestedBy: v.optional(v.array(v.id("users"))),
    watchedAt: v.number(),
    ratings: v.array(
      v.object({
        userId: v.id("users"),
        score: v.number(),
        note: v.optional(v.string()),
      }),
    ),
  })
    .index("by_movie", ["movieId"])
    .index("by_night", ["nightId"]),

  collections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  collection_movies: defineTable({
    collectionId: v.id("collections"),
    movieId: v.id("movies"),
    addedBy: v.id("users"),
    addedAt: v.number(),
  })
    .index("by_collection", ["collectionId"])
    .index("by_collection_movie", ["collectionId", "movieId"]),

  restaurants: defineTable({
    name: v.string(),
    category: v.string(),
    addedBy: v.id("users"),
    addedAt: v.number(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    city: v.optional(
      v.union(
        v.literal("dammam"),
        v.literal("saihat"),
        v.literal("qatif"),
      ),
    ),
    imageUrl: v.optional(v.string()),
    upvotes: v.array(v.id("users")),
  })
    .index("by_category", ["category"])
    .index("by_city", ["city"]),
});
