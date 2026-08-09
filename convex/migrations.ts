import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api";
import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_ORG_CODE,
  DEFAULT_ORG_NAME,
} from "./lib/orgConstants";
import { isAppOwner, requireAppOwner } from "./lib/users";
import { findOrgByCode } from "./lib/orgs";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const migrations = new Migrations(components.migrations);

async function seedWeebsAndBackfillHandler(ctx: MutationCtx) {
  let org = await findOrgByCode(ctx, DEFAULT_ORG_CODE);
  const users = await ctx.db.query("users").collect();
  const activeUsers = users.filter((u) => u.deletedAt === undefined);

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
      });
      membersAdded += 1;
    } else if (isAppOwner(user.email) && existing.role !== "owner") {
      await ctx.db.patch(existing._id, { role: "owner" });
    }

    if (!user.activeOrgId) {
      await ctx.db.patch(user._id, { activeOrgId: orgId });
    }
  }

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

  return { orgId, membersAdded, patched };
}

/** Seed weebs, memberships, and backfill orgId on domain tables. Idempotent. */
export const seedWeebsAndBackfill = internalMutation({
  args: {},
  returns: v.object({
    orgId: v.id("organizations"),
    membersAdded: v.number(),
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
