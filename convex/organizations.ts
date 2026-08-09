import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  hasAcceptedCurrentTerms,
  isAppOwner,
  requireActiveUser,
  requireTermsAccepted,
} from "./lib/users";
import {
  findOrgByCode,
  getMembership,
  listMembershipsForUser,
  requireOrgMembership,
  requireOwnerMembership,
} from "./lib/orgs";
import {
  DEFAULT_ORG_CODE,
  isValidOrgCode,
  normalizeOrgCode,
  orgRoleValidator,
} from "./lib/orgConstants";
import type { Id } from "./_generated/dataModel";

const orgSummaryValidator = v.object({
  _id: v.id("organizations"),
  name: v.string(),
  code: v.string(),
  role: orgRoleValidator,
  joinedAt: v.number(),
  createdAt: v.number(),
});

export const listMine = query({
  args: {},
  returns: v.array(orgSummaryValidator),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const memberships = await listMembershipsForUser(ctx, user._id);
    const results = [];
    for (const membership of memberships) {
      const org = await ctx.db.get(membership.orgId);
      if (!org) continue;
      results.push({
        _id: org._id,
        name: org.name,
        code: org.code,
        role: membership.role,
        joinedAt: membership.joinedAt,
        createdAt: org.createdAt,
      });
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getActive = query({
  args: {},
  returns: v.union(orgSummaryValidator, v.null()),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    if (!user.activeOrgId) return null;
    const membership = await getMembership(ctx, user._id, user.activeOrgId);
    if (!membership) return null;
    const org = await ctx.db.get(user.activeOrgId);
    if (!org) return null;
    return {
      _id: org._id,
      name: org.name,
      code: org.code,
      role: membership.role,
      joinedAt: membership.joinedAt,
      createdAt: org.createdAt,
    };
  },
});

export const needsOrgGate = query({
  args: {},
  returns: v.object({
    needsTerms: v.boolean(),
    needsOrg: v.boolean(),
    needsOnboarding: v.boolean(),
  }),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const memberships = await listMembershipsForUser(ctx, user._id);
    return {
      needsTerms: !hasAcceptedCurrentTerms(user),
      needsOrg: memberships.length === 0,
      needsOnboarding: !user.name?.trim(),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    requireTermsAccepted(user);

    const name = args.name.trim();
    if (name.length < 2 || name.length > 64) {
      throw new Error("Organization name must be 2–64 characters");
    }

    const code = normalizeOrgCode(
      args.code?.trim() || name.slice(0, 12) || DEFAULT_ORG_CODE,
    );
    if (!isValidOrgCode(code)) {
      throw new Error("Code must be 3–32 characters (letters, numbers, _-)");
    }

    const existing = await findOrgByCode(ctx, code);
    if (existing) throw new Error("That organization code is already taken");

    const now = Date.now();
    const orgId = await ctx.db.insert("organizations", {
      name,
      code,
      createdBy: user._id,
      createdAt: now,
    });

    await ctx.db.insert("organizationMembers", {
      orgId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });

    await ctx.db.patch(user._id, { activeOrgId: orgId });
    return orgId;
  },
});

export const joinByCode = mutation({
  args: { code: v.string() },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    requireTermsAccepted(user);

    const code = normalizeOrgCode(args.code);
    if (!isValidOrgCode(code)) throw new Error("Invalid organization code");

    const org = await findOrgByCode(ctx, code);
    if (!org) throw new Error("No organization found with that code");

    const existing = await getMembership(ctx, user._id, org._id);
    if (!existing) {
      await ctx.db.insert("organizationMembers", {
        orgId: org._id,
        userId: user._id,
        role: "member",
        joinedAt: Date.now(),
      });
    }

    await ctx.db.patch(user._id, { activeOrgId: org._id });
    return org._id;
  },
});

export const setActive = mutation({
  args: { orgId: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    await requireOrgMembership(ctx, user._id, args.orgId);
    await ctx.db.patch(user._id, { activeOrgId: args.orgId });
    return null;
  },
});

export const rotateCode = mutation({
  args: {
    orgId: v.id("organizations"),
    code: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    requireTermsAccepted(user);
    await requireOwnerMembership(ctx, user._id, args.orgId);

    const code = normalizeOrgCode(args.code);
    if (!isValidOrgCode(code)) {
      throw new Error("Code must be 3–32 characters (letters, numbers, _-)");
    }

    const clash = await findOrgByCode(ctx, code);
    if (clash && clash._id !== args.orgId) {
      throw new Error("That organization code is already taken");
    }

    await ctx.db.patch(args.orgId, { code });
    return null;
  },
});

export const rename = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    requireTermsAccepted(user);
    await requireOwnerMembership(ctx, user._id, args.orgId);

    const name = args.name.trim();
    if (name.length < 2 || name.length > 64) {
      throw new Error("Organization name must be 2–64 characters");
    }

    await ctx.db.patch(args.orgId, { name });
    return null;
  },
});

export const listMembers = query({
  args: { orgId: v.id("organizations") },
  returns: v.array(
    v.object({
      membershipId: v.id("organizationMembers"),
      userId: v.id("users"),
      role: orgRoleValidator,
      joinedAt: v.number(),
      name: v.union(v.string(), v.null()),
      email: v.union(v.string(), v.null()),
      avatar: v.union(v.string(), v.null()),
      image: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    await requireOrgMembership(ctx, user._id, args.orgId);

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const rows = [];
    for (const membership of memberships) {
      const member = await ctx.db.get(membership.userId);
      if (!member || member.deletedAt !== undefined) continue;
      rows.push({
        membershipId: membership._id,
        userId: membership.userId,
        role: membership.role,
        joinedAt: membership.joinedAt,
        name: member.name ?? null,
        email: member.email ?? null,
        avatar: member.avatar ?? null,
        image: member.image ?? null,
      });
    }
    return rows.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  },
});

export const removeMember = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    requireTermsAccepted(user);
    await requireOwnerMembership(ctx, user._id, args.orgId);

    if (args.userId === user._id) {
      throw new Error("Owners cannot remove themselves");
    }

    const membership = await getMembership(ctx, args.userId, args.orgId);
    if (!membership) throw new Error("Member not found");
    if (membership.role === "owner") {
      throw new Error("Cannot remove another owner");
    }

    await ctx.db.delete(membership._id);

    const memberUser = await ctx.db.get(args.userId);
    if (memberUser?.activeOrgId === args.orgId) {
      await ctx.db.patch(args.userId, { activeOrgId: undefined });
    }
    return null;
  },
});

export const leave = mutation({
  args: { orgId: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const membership = await getMembership(ctx, user._id, args.orgId);
    if (!membership) throw new Error("Not a member of this organization");

    if (membership.role === "owner") {
      const members = await ctx.db
        .query("organizationMembers")
        .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
        .collect();
      const owners = members.filter((m) => m.role === "owner");
      if (owners.length <= 1) {
        throw new Error(
          "You are the only owner — transfer ownership or delete the org first",
        );
      }
    }

    await ctx.db.delete(membership._id);

    if (user.activeOrgId === args.orgId) {
      const remaining = await listMembershipsForUser(ctx, user._id);
      const next: Id<"organizations"> | undefined = remaining[0]?.orgId;
      await ctx.db.patch(user._id, { activeOrgId: next });
    }
    return null;
  },
});

export const getByCodePreview = query({
  args: { code: v.string() },
  returns: v.union(
    v.object({
      name: v.string(),
      code: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const code = normalizeOrgCode(args.code);
    if (!isValidOrgCode(code)) return null;
    const org = await findOrgByCode(ctx, code);
    if (!org) return null;
    return { name: org.name, code: org.code };
  },
});

/** App-owner helper: whether the caller is the deployment owner (not org owner). */
export const amIAppOwner = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    return isAppOwner(user.email);
  },
});
