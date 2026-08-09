import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { requireActiveUser, requireTermsAccepted } from "./lib/users";
import {
  getMembership,
  requireOrgMembership,
  requireOwnerMembership,
} from "./lib/orgs";
import { INVITE_TTL_MS } from "./lib/orgConstants";
import { renderInviteEmail } from "./lib/inviteEmail";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const listPending = query({
  args: { orgId: v.id("organizations") },
  returns: v.array(
    v.object({
      _id: v.id("organizationInvites"),
      email: v.string(),
      status: v.string(),
      createdAt: v.number(),
      expiresAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    await requireOrgMembership(ctx, user._id, args.orgId);

    const invites = await ctx.db
      .query("organizationInvites")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const now = Date.now();
    return invites
      .filter((i) => i.status === "pending" && i.expiresAt > now)
      .map((i) => ({
        _id: i._id,
        email: i.email,
        status: i.status,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
      }));
  },
});

export const getByToken = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      orgName: v.string(),
      email: v.string(),
      status: v.string(),
      expiresAt: v.number(),
      expired: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("organizationInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!invite) return null;
    const org = await ctx.db.get(invite.orgId);
    if (!org) return null;
    const expired =
      invite.status !== "pending" || invite.expiresAt <= Date.now();
    return {
      orgName: org.name,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expiresAt,
      expired,
    };
  },
});

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    email: v.string(),
  },
  returns: v.id("organizationInvites"),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    requireTermsAccepted(user);
    const { org } = await requireOwnerMembership(ctx, user._id, args.orgId);

    const email = normalizeEmail(args.email);
    if (!email.includes("@")) throw new Error("Invalid email address");

    const now = Date.now();
    const token = randomToken();
    const inviteId = await ctx.db.insert("organizationInvites", {
      orgId: args.orgId,
      email,
      token,
      invitedBy: user._id,
      status: "pending",
      createdAt: now,
      expiresAt: now + INVITE_TTL_MS,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.organizationInvites.sendInviteEmail,
      {
        inviteId,
        orgName: org.name,
        inviterName: user.name ?? "A MOVINIGHT member",
        email,
        token,
      },
    );

    return inviteId;
  },
});

export const revoke = mutation({
  args: { inviteId: v.id("organizationInvites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    requireTermsAccepted(user);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    await requireOwnerMembership(ctx, user._id, invite.orgId);
    await ctx.db.patch(args.inviteId, { status: "revoked" });
    return null;
  },
});

export const accept = mutation({
  args: { token: v.string() },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    requireTermsAccepted(user);

    const invite = await ctx.db
      .query("organizationInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") {
      throw new Error("This invite is no longer valid");
    }
    if (invite.expiresAt <= Date.now()) {
      await ctx.db.patch(invite._id, { status: "expired" });
      throw new Error("This invite has expired");
    }

    const userEmail = user.email?.trim().toLowerCase();
    if (!userEmail || userEmail !== invite.email) {
      throw new Error(
        "Sign in with the invited email address to accept this invite",
      );
    }

    const existing = await getMembership(ctx, user._id, invite.orgId);
    if (!existing) {
      await ctx.db.insert("organizationMembers", {
        orgId: invite.orgId,
        userId: user._id,
        role: "member",
        joinedAt: Date.now(),
      });
    }

    await ctx.db.patch(invite._id, { status: "accepted" });
    await ctx.db.patch(user._id, { activeOrgId: invite.orgId });
    return invite.orgId;
  },
});

export const sendInviteEmail = internalAction({
  args: {
    inviteId: v.id("organizationInvites"),
    orgName: v.string(),
    inviterName: v.string(),
    email: v.string(),
    token: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const apiKey = process.env.AUTH_RESEND_KEY;
    if (!apiKey) {
      console.error("AUTH_RESEND_KEY is not set — invite email skipped");
      return null;
    }

    const siteUrl = (
      process.env.SITE_URL ?? "https://www.whopickedthis.app"
    ).replace(/\/$/, "");
    const inviteUrl = `${siteUrl}/invite/${args.token}`;

    const from =
      process.env.AUTH_RESEND_FROM ?? "MOVINIGHT <onboarding@resend.dev>";

    const { subject, html, text } = renderInviteEmail({
      orgName: args.orgName,
      inviterName: args.inviterName,
      inviteUrl,
      expiresInDays: 7,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.email],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend invite send failed", {
        status: res.status,
        body,
        inviteId: args.inviteId,
      });
      throw new Error(`Failed to send invite email: ${body}`);
    }
    return null;
  },
});

/** Marks expired pending invites (optional maintenance). */
export const markExpired = internalMutation({
  args: { inviteId: v.id("organizationInvites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.status !== "pending") return null;
    if (invite.expiresAt <= Date.now()) {
      await ctx.db.patch(args.inviteId, { status: "expired" });
    }
    return null;
  },
});
