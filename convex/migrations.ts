import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_ORG_CODE,
  DEFAULT_ORG_NAME,
} from "./lib/orgConstants";
import { isAppOwner, requireAppOwner } from "./lib/users";
import {
  findOrgByCode,
} from "./lib/orgs";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const migrations = new Migrations(components.migrations);

/** Restore original Weebs members to full access (no code re-entry required). */
async function restoreLegacyWeebsMemberships(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
): Promise<{ restoredLegacy: number; orgSetupFixed: number }> {
  const memberships = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();

  const now = Date.now();
  let restoredLegacy = 0;
  let orgSetupFixed = 0;

  for (const membership of memberships) {
    // Original crew rows were marked `seed` (or left without source). Promote them.
    if (membership.source === "seed" || membership.source === undefined) {
      await ctx.db.patch(membership._id, { source: "legacy" });
      restoredLegacy += 1;
    }

    const user = await ctx.db.get(membership.userId);
    if (!user || user.deletedAt !== undefined) continue;

    const patch: {
      activeOrgId?: Id<"organizations">;
      orgSetupCompletedAt?: number;
    } = {};

    if (user.orgSetupCompletedAt === undefined) {
      patch.orgSetupCompletedAt = now;
      orgSetupFixed += 1;
    }
    if (user.activeOrgId === undefined) {
      patch.activeOrgId = orgId;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }
  }

  return { restoredLegacy, orgSetupFixed };
}

async function seedWeebsAndBackfillHandler(ctx: MutationCtx) {
  let org = await findOrgByCode(ctx, DEFAULT_ORG_CODE);
  const users = await ctx.db.query("users").collect();
  const activeUsers = users.filter((u) => u.deletedAt === undefined);
  const createdOrg = !org;

  if (!org) {
    const owner =
      activeUsers.find((u) => isAppOwner(u.email)) ?? activeUsers[0];
    if (!owner) {
      throw new Error("Cannot seed weebs — no users in the database yet");
    }
    const orgId = await ctx.db.insert("organizations", {
      name: DEFAULT_ORG_NAME,
      code: DEFAULT_ORG_CODE,
      createdBy: owner._id,
      createdAt: Date.now(),
    });
    org = (await ctx.db.get(orgId))!;
  }

  const orgId = org._id;
  let membersAdded = 0;
  const now = Date.now();

  // Only auto-add memberships the first time weebs is created. Those users are
  // the original crew (`legacy`). Later runs must not enroll new signups.
  if (createdOrg) {
    for (const user of activeUsers) {
      const existing = await ctx.db
        .query("organizationMembers")
        .withIndex("by_org_and_user", (q) =>
          q.eq("orgId", orgId).eq("userId", user._id),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("organizationMembers", {
          orgId,
          userId: user._id,
          role: isAppOwner(user.email) ? "owner" : "member",
          joinedAt: now,
          source: "legacy",
        });
        membersAdded += 1;
      }

      await ctx.db.patch(user._id, {
        ...(user.activeOrgId === undefined ? { activeOrgId: orgId } : {}),
        ...(user.orgSetupCompletedAt === undefined
          ? { orgSetupCompletedAt: now }
          : {}),
      });
    }
  } else {
    for (const user of activeUsers) {
      const existing = await ctx.db
        .query("organizationMembers")
        .withIndex("by_org_and_user", (q) =>
          q.eq("orgId", orgId).eq("userId", user._id),
        )
        .unique();
      if (existing && isAppOwner(user.email) && existing.role !== "owner") {
        await ctx.db.patch(existing._id, { role: "owner" });
      }
    }
  }

  const restored = await restoreLegacyWeebsMemberships(ctx, orgId);

  const patched = {
    watchlist: 0,
    nights: 0,
    watched: 0,
    collections: 0,
    restaurants: 0,
  };

  for (const doc of await ctx.db.query("watchlist_entries").collect()) {
    if (!doc.orgId) {
      await ctx.db.patch(doc._id, { orgId });
      patched.watchlist += 1;
    }
  }
  for (const doc of await ctx.db.query("movie_nights").collect()) {
    if (!doc.orgId) {
      await ctx.db.patch(doc._id, { orgId });
      patched.nights += 1;
    }
  }
  for (const doc of await ctx.db.query("watched_entries").collect()) {
    if (!doc.orgId) {
      await ctx.db.patch(doc._id, { orgId });
      patched.watched += 1;
    }
  }
  for (const doc of await ctx.db.query("collections").collect()) {
    if (!doc.orgId) {
      await ctx.db.patch(doc._id, { orgId });
      patched.collections += 1;
    }
  }
  for (const doc of await ctx.db.query("restaurants").collect()) {
    if (!doc.orgId) {
      await ctx.db.patch(doc._id, { orgId });
      patched.restaurants += 1;
    }
  }

  return {
    orgId,
    membersAdded,
    restoredLegacy: restored.restoredLegacy,
    orgSetupFixed: restored.orgSetupFixed,
    patched,
  };
}

/** Seed weebs, memberships, and backfill orgId on domain tables. Idempotent. */
export const seedWeebsAndBackfill = internalMutation({
  args: {},
  returns: v.object({
    orgId: v.id("organizations"),
    membersAdded: v.number(),
    restoredLegacy: v.number(),
    orgSetupFixed: v.number(),
    patched: v.object({
      watchlist: v.number(),
      nights: v.number(),
      watched: v.number(),
      collections: v.number(),
      restaurants: v.number(),
    }),
  }),
  handler: async (ctx) => seedWeebsAndBackfillHandler(ctx),
});

/** App owner can run the bootstrap from the client once after deploy. */
export const runBootstrap = mutation({
  args: {},
  returns: v.object({
    orgId: v.id("organizations"),
    membersAdded: v.number(),
    restoredLegacy: v.number(),
    orgSetupFixed: v.number(),
    patched: v.object({
      watchlist: v.number(),
      nights: v.number(),
      watched: v.number(),
      collections: v.number(),
      restaurants: v.number(),
    }),
  }),
  handler: async (ctx) => {
    await requireAppOwner(ctx);
    return await seedWeebsAndBackfillHandler(ctx);
  },
});

/** Table migrations for @convex-dev/migrations component (optional CLI use). */
export const backfillWatchlistOrgId = migrations.define({
  table: "watchlist_entries",
  migrateOne: async (ctx, doc) => {
    if (doc.orgId) return;
    const org = await findOrgByCode(ctx, DEFAULT_ORG_CODE);
    if (!org) return;
    return { orgId: org._id as Id<"organizations"> };
  },
});

export const backfillNightsOrgId = migrations.define({
  table: "movie_nights",
  migrateOne: async (ctx, doc) => {
    if (doc.orgId) return;
    const org = await findOrgByCode(ctx, DEFAULT_ORG_CODE);
    if (!org) return;
    return { orgId: org._id as Id<"organizations"> };
  },
});

export const backfillWatchedOrgId = migrations.define({
  table: "watched_entries",
  migrateOne: async (ctx, doc) => {
    if (doc.orgId) return;
    const org = await findOrgByCode(ctx, DEFAULT_ORG_CODE);
    if (!org) return;
    return { orgId: org._id as Id<"organizations"> };
  },
});

export const backfillCollectionsOrgId = migrations.define({
  table: "collections",
  migrateOne: async (ctx, doc) => {
    if (doc.orgId) return;
    const org = await findOrgByCode(ctx, DEFAULT_ORG_CODE);
    if (!org) return;
    return { orgId: org._id as Id<"organizations"> };
  },
});

export const backfillRestaurantsOrgId = migrations.define({
  table: "restaurants",
  migrateOne: async (ctx, doc) => {
    if (doc.orgId) return;
    const org = await findOrgByCode(ctx, DEFAULT_ORG_CODE);
    if (!org) return;
    return { orgId: org._id as Id<"organizations"> };
  },
});
