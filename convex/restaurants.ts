import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveUser, isAppOwner, requireActiveUser } from "./lib/users";
import { EASTERN_PROVINCE_RESTAURANTS } from "./lib/easternProvinceRestaurants";

const cityValidator = v.union(
  v.literal("dammam"),
  v.literal("saihat"),
  v.literal("qatif"),
);

export const getRestaurants = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getActiveUser(ctx);
    if (!caller) return [];

    const callerIsOwner = isAppOwner(caller.email);

    const restaurants = await ctx.db.query("restaurants").collect();
    const enriched = await Promise.all(
      restaurants.map(async (r) => {
        const addedByUser = await ctx.db.get(r.addedBy);
        return {
          ...r,
          addedByName: addedByUser?.name ?? "Unknown",
          hasUpvoted: r.upvotes.includes(caller._id),
          isOwner: callerIsOwner || r.addedBy === caller._id,
        };
      }),
    );
    return enriched.sort((a, b) => b.upvotes.length - a.upvotes.length);
  },
});

export const addRestaurant = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    city: v.optional(cityValidator),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = (await requireActiveUser(ctx))._id;
    return await ctx.db.insert("restaurants", {
      ...args,
      addedBy: userId,
      addedAt: Date.now(),
      upvotes: [],
    });
  },
});

export const deleteRestaurant = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, { restaurantId }) => {
    await requireActiveUser(ctx);
    await ctx.db.delete(restaurantId);
  },
});

export const toggleUpvote = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, { restaurantId }) => {
    const userId = (await requireActiveUser(ctx))._id;

    const restaurant = await ctx.db.get(restaurantId);
    if (!restaurant) throw new Error("Not found");

    const hasUpvoted = restaurant.upvotes.includes(userId);
    await ctx.db.patch(restaurantId, {
      upvotes: hasUpvoted
        ? restaurant.upvotes.filter((id) => id !== userId)
        : [...restaurant.upvotes, userId],
    });
  },
});

/**
 * Idempotent seed of curated Dammam / Saihat / Qatif restaurants.
 * Attributed to APP_OWNER_EMAIL. Re-running only inserts missing name+city pairs.
 *
 * npx convex run restaurants:seedEasternProvinceRestaurants
 */
export const seedEasternProvinceRestaurants = internalMutation({
  args: {},
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
    total: v.number(),
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

    const existing = await ctx.db.query("restaurants").collect();
    const existingKeys = new Set(
      existing.map((r) => `${r.name.toLowerCase()}::${r.city ?? ""}`),
    );

    let inserted = 0;
    let skipped = 0;
    const now = Date.now();

    for (const spot of EASTERN_PROVINCE_RESTAURANTS) {
      const key = `${spot.name.toLowerCase()}::${spot.city}`;
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      await ctx.db.insert("restaurants", {
        name: spot.name,
        category: spot.category,
        city: spot.city,
        address: spot.address,
        notes: spot.notes,
        priceRange: spot.priceRange,
        imageUrl: spot.imageUrl,
        addedBy: owner._id,
        addedAt: now,
        upvotes: [],
      });
      existingKeys.add(key);
      inserted += 1;
    }

    return {
      inserted,
      skipped,
      total: EASTERN_PROVINCE_RESTAURANTS.length,
    };
  },
});
