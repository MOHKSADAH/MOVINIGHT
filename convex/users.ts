import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

function isAppOwner(email: string | undefined): boolean {
  const ownerEmail = process.env.APP_OWNER_EMAIL;
  return !!ownerEmail && !!email && email === ownerEmail;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return { ...user, isOwner: isAppOwner(user.email) };
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return { ...user, isOwner: isAppOwner(user.email) };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("users").collect();
  },
});

/** Crew roster with per-member watch/rating/night stats for the members page. */
export const listCrew = query({
  args: {},
  handler: async (ctx) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) return [];

    const [users, watched, watchlist, nights] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("watched_entries").collect(),
      ctx.db.query("watchlist_entries").collect(),
      ctx.db.query("movie_nights").collect(),
    ]);

    return users
      .map((user) => {
        const ratings = watched.flatMap((e) =>
          e.ratings.filter((r) => r.userId === user._id),
        );
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
            : null;
        const suggestions = watchlist.filter((e) => e.addedBy === user._id)
          .length;
        const nightsHosted = nights.filter((n) => n.hostId === user._id).length;
        const nightsAttended = nights.filter((n) =>
          n.attendees.includes(user._id),
        ).length;

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          image: user.image,
          avatar: user.avatar,
          bio: user.bio,
          isOwner: isAppOwner(user.email),
          isYou: user._id === callerId,
          ratingsGiven: ratings.length,
          avgRating,
          suggestions,
          nightsHosted,
          nightsAttended,
        };
      })
      .sort((a, b) => {
        if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
        if (a.isYou !== b.isYou) return a.isYou ? -1 : 1;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });
  },
});

export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const patch: Partial<{ name: string; avatar: string; bio: string }> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.avatar !== undefined) patch.avatar = args.avatar;
    if (args.bio !== undefined) patch.bio = args.bio;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(userId, patch);
    }
  },
});
