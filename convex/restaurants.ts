import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getActiveUser, isAppOwner, requireActiveUser } from "./lib/users";

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
