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
  isEffectiveMembership,
  listEffectiveMembershipsForUser,
} from "./lib/orgs";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const migrations = new Migrations(components.migrations);

/** Mark weebs migration rows as seed and point activeOrg away from them. */
async function demoteSeedWeebsMemberships(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
): Promise<{ markedSeed: number; activeOrgFixed: number }> {
  const memberships = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();

  let markedSeed = 0;
  let activeOrgFixed = 0;

  for (const membership of memberships) {
    // Legacy rows have no source; treat them as seed until an explicit join.
    if (membership.source === undefined) {
      await ctx.db.patch(membership._id, { source: "seed" });
      markedSeed += 1;
    }
  }

  // Re-read after patches so active-org fix sees source: "seed".
  const refreshed = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org", (q) => q.eq("orgId", orgId))
    .collect();

  for (const membership of refreshed) {
    if (isEffectiveMembership(membership)) continue;
    const user = await ctx.db.get(membership.userId);
    if (!user || user.activeOrgId !== orgId) continue;

    const remaining = await listEffectiveMembershipsForUser(ctx, user._id);
    await ctx.db.patch(user._id, {
      activeOrgId: remaining[0]?.orgId,
    });
    activeOrgFixed += 1;
  }

  return { markedSeed, activeOrgFixed };
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

  // Only auto-add memberships the first time weebs is created. Later runs must
  // not silently enroll new signups — they have to join/create explicitly.
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
          joinedAt: Date.now(),
          source: "seed",
        });
        membersAdded += 1;
      }
      // Do not set activeOrgId — seed membership is not usable until join-by-code.
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

  const demoted = await demoteSeedWeebsMemberships(ctx, orgId);

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
    markedSeed: demoted.markedSeed,
    activeOrgFixed: demoted.activeOrgFixed,
    patched,
  };
}

/** Seed weebs, memberships, and backfill orgId on domain tables. Idempotent. */
export const seedWeebsAndBackfill = internalMutation({
  args: {},
  returns: v.object({
    orgId: v.id("organizations"),
    membersAdded: v.number(),
    markedSeed: v.number(),
    activeOrgFixed: v.number(),
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
    markedSeed: v.number(),
    activeOrgFixed: v.number(),
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
