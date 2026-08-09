import {
  customCtx,
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { mutation, query } from "../_generated/server";
import {
  getActiveUser,
  requireActiveUser,
  requireTermsAccepted,
} from "./users";
import {
  getEffectiveMembership,
  requireOrgMembership,
  requireOwnerMembership,
} from "./orgs";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";

/** Authenticated query — injects `user` (active, non-deleted). */
export const authedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await requireActiveUser(ctx);
    return { user };
  }),
);

/** Authenticated mutation — injects `user`. */
export const authedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await requireActiveUser(ctx);
    return { user };
  }),
);

/**
 * Org-scoped query. Requires `orgId` arg, verifies membership, injects
 * `user`, `org`, `membership`.
 */
export const orgQuery = customQuery(query, {
  args: { orgId: v.id("organizations") },
  input: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const { org, membership } = await requireOrgMembership(
      ctx,
      user._id,
      args.orgId,
    );
    return {
      ctx: { user, org, membership },
      args: { orgId: args.orgId },
    };
  },
});

/**
 * Org-scoped mutation. Same membership gate as orgQuery.
 */
export const orgMutation = customMutation(mutation, {
  args: { orgId: v.id("organizations") },
  input: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    await requireTermsAccepted(user);
    const { org, membership } = await requireOrgMembership(
      ctx,
      user._id,
      args.orgId,
    );
    return {
      ctx: { user, org, membership },
      args: { orgId: args.orgId },
    };
  },
});

/** Owner-only org mutation. */
export const orgOwnerMutation = customMutation(mutation, {
  args: { orgId: v.id("organizations") },
  input: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    await requireTermsAccepted(user);
    const { org, membership } = await requireOwnerMembership(
      ctx,
      user._id,
      args.orgId,
    );
    return {
      ctx: { user, org, membership },
      args: { orgId: args.orgId },
    };
  },
});

export type OrgContext = {
  user: Doc<"users">;
  org: Doc<"organizations">;
  membership: Doc<"organizationMembers">;
  orgId: Id<"organizations">;
};

/**
 * Resolve the caller's active organization from `users.activeOrgId`.
 * Used by domain modules so clients need not pass orgId on every call.
 */
export async function requireActiveOrgContext(
  ctx: Parameters<typeof getActiveUser>[0],
): Promise<OrgContext> {
  const user = await requireActiveUser(ctx);
  if (!user.activeOrgId) {
    throw new Error("No active organization — join or create one first");
  }
  const { org, membership } = await requireOrgMembership(
    ctx,
    user._id,
    user.activeOrgId,
  );
  return { user, org, membership, orgId: user.activeOrgId };
}

export async function getActiveOrgContext(
  ctx: Parameters<typeof getActiveUser>[0],
): Promise<OrgContext | null> {
  const user = await getActiveUser(ctx);
  if (!user?.activeOrgId) return null;
  const membership = await getEffectiveMembership(
    ctx,
    user._id,
    user.activeOrgId,
  );
  if (!membership) return null;
  const org = await ctx.db.get(user.activeOrgId);
  if (!org) return null;
  return { user, org, membership, orgId: user.activeOrgId };
}
