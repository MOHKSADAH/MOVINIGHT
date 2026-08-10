import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AnyCtx = QueryCtx | MutationCtx;

/**
 * Memberships that grant org access. `"seed"` is excluded (use `"legacy"` for
 * original Weebs crew). Missing source is treated as effective for older rows.
 */
export function isEffectiveMembership(
  membership: Doc<"organizationMembers">,
): boolean {
  return membership.source !== "seed";
}

export async function getMembership(
  ctx: AnyCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<Doc<"organizationMembers"> | null> {
  return await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_and_user", (q) =>
      q.eq("orgId", orgId).eq("userId", userId),
    )
    .unique();
}

export async function getEffectiveMembership(
  ctx: AnyCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<Doc<"organizationMembers"> | null> {
  const membership = await getMembership(ctx, userId, orgId);
  if (!membership || !isEffectiveMembership(membership)) return null;
  return membership;
}

export async function requireOrgMembership(
  ctx: AnyCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<{
  org: Doc<"organizations">;
  membership: Doc<"organizationMembers">;
}> {
  const org = await ctx.db.get(orgId);
  if (!org) throw new Error("Organization not found");

  const membership = await getEffectiveMembership(ctx, userId, orgId);
  if (!membership) throw new Error("Not a member of this organization");

  return { org, membership };
}

export async function requireOwnerMembership(
  ctx: AnyCtx,
  userId: Id<"users">,
  orgId: Id<"organizations">,
): Promise<{
  org: Doc<"organizations">;
  membership: Doc<"organizationMembers">;
}> {
  const result = await requireOrgMembership(ctx, userId, orgId);
  if (result.membership.role !== "owner") {
    throw new Error("Owner access required");
  }
  return result;
}

export async function listMembershipsForUser(
  ctx: AnyCtx,
  userId: Id<"users">,
): Promise<Doc<"organizationMembers">[]> {
  return await ctx.db
    .query("organizationMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
}

export async function listEffectiveMembershipsForUser(
  ctx: AnyCtx,
  userId: Id<"users">,
): Promise<Doc<"organizationMembers">[]> {
  const memberships = await listMembershipsForUser(ctx, userId);
  return memberships.filter(isEffectiveMembership);
}

export async function findOrgByCode(
  ctx: AnyCtx,
  code: string,
): Promise<Doc<"organizations"> | null> {
  return await ctx.db
    .query("organizations")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();
}

export async function assertOrgAccessible(
  ctx: AnyCtx,
  userId: Id<"users">,
  orgId: Id<"organizations"> | undefined,
): Promise<void> {
  if (!orgId) throw new Error("Resource is missing organization scope");
  await requireOrgMembership(ctx, userId, orgId);
}
