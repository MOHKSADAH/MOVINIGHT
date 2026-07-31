import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AnyCtx = QueryCtx | MutationCtx;

/** The single admin account, identified by the APP_OWNER_EMAIL deployment variable. */
export function isAppOwner(email: string | undefined): boolean {
  const ownerEmail = process.env.APP_OWNER_EMAIL;
  return !!ownerEmail && !!email && email === ownerEmail;
}

/** The signed-in user, or null when unauthenticated or the account was deleted. */
export async function getActiveUser(ctx: AnyCtx): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  if (!user || user.deletedAt !== undefined) return null;
  return user;
}

export async function requireActiveUser(ctx: AnyCtx): Promise<Doc<"users">> {
  const user = await getActiveUser(ctx);
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireAppOwner(ctx: AnyCtx): Promise<Doc<"users">> {
  const user = await requireActiveUser(ctx);
  if (!isAppOwner(user.email)) throw new Error("Not authorized");
  return user;
}

/**
 * Anonymizes a member and revokes every credential tied to them.
 *
 * Shared history — nights they hosted, watched entries, ratings they gave — is
 * deliberately preserved so the crew's timeline stays intact. Only personal
 * details and live participation (votes, upcoming attendance) are removed.
 */
export async function deleteAccount(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  await revokeAuthCredentials(ctx, userId);
  await removeLiveParticipation(ctx, userId);

  const user = await ctx.db.get(userId);
  if (user?.avatarStorageId) {
    await ctx.storage.delete(user.avatarStorageId);
  }

  await ctx.db.patch(userId, {
    name: undefined,
    email: undefined,
    image: undefined,
    avatar: undefined,
    avatarStorageId: undefined,
    bio: undefined,
    phone: undefined,
    emailVerificationTime: undefined,
    phoneVerificationTime: undefined,
    deletedAt: Date.now(),
  });
}

/**
 * Deletes the Convex Auth rows that let this user sign in or refresh a token.
 * Mirrors the library's own `deleteSession` cascade, which the library only
 * exposes through an action.
 */
async function revokeAuthCredentials(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();

  for (const session of sessions) {
    const refreshTokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
    for (const token of refreshTokens) {
      await ctx.db.delete(token._id);
    }
    await ctx.db.delete(session._id);
  }

  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();

  for (const account of accounts) {
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .collect();
    for (const code of codes) {
      await ctx.db.delete(code._id);
    }
    await ctx.db.delete(account._id);
  }

  if (sessions.length > 0) {
    // authVerifiers holds transient OAuth PKCE state and has no index on sessionId.
    const sessionIds = new Set(sessions.map((s) => s._id));
    const verifiers = await ctx.db.query("authVerifiers").collect();
    for (const verifier of verifiers) {
      if (verifier.sessionId && sessionIds.has(verifier.sessionId)) {
        await ctx.db.delete(verifier._id);
      }
    }
  }
}

/** Strips votes and not-yet-happened attendance so a gone member stops counting. */
async function removeLiveParticipation(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<void> {
  const watchlistEntries = await ctx.db.query("watchlist_entries").collect();
  for (const entry of watchlistEntries) {
    const upvotes = entry.upvotes.filter((id) => id !== userId);
    const downvotes = entry.downvotes?.filter((id) => id !== userId);
    const upvotesChanged = upvotes.length !== entry.upvotes.length;
    const downvotesChanged =
      downvotes !== undefined && downvotes.length !== entry.downvotes!.length;

    if (upvotesChanged || downvotesChanged) {
      await ctx.db.patch(entry._id, {
        ...(upvotesChanged ? { upvotes } : {}),
        ...(downvotesChanged ? { downvotes } : {}),
      });
    }
  }

  const restaurants = await ctx.db.query("restaurants").collect();
  for (const restaurant of restaurants) {
    const upvotes = restaurant.upvotes.filter((id) => id !== userId);
    if (upvotes.length !== restaurant.upvotes.length) {
      await ctx.db.patch(restaurant._id, { upvotes });
    }
  }

  // Attendance on a night that hasn't finished is live state; done nights are history.
  for (const status of ["upcoming", "active"] as const) {
    const nights = await ctx.db
      .query("movie_nights")
      .withIndex("by_status", (q) => q.eq("status", status))
      .collect();
    for (const night of nights) {
      const attendees = night.attendees.filter((id) => id !== userId);
      if (attendees.length !== night.attendees.length) {
        await ctx.db.patch(night._id, { attendees });
      }
    }
  }
}
