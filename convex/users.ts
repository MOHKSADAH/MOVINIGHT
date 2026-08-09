import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  deleteAccount as deleteAccountForUser,
  getActiveUser,
  hasAcceptedCurrentTerms,
  isAppOwner,
  requireActiveUser,
} from "./lib/users";
import {
  PRIVACY_VERSION,
  TERMS_VERSION,
} from "./lib/orgConstants";
import { getActiveOrgContext } from "./lib/customFunctions";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
  isAvatarPresetSrc,
} from "./lib/avatars";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getActiveUser(ctx);
    if (!user) return null;
    return {
      ...user,
      isOwner: isAppOwner(user.email),
      hasAcceptedTerms: hasAcceptedCurrentTerms(user),
    };
  },
});

/**
 * Whether the signed-in account still exists: `null` while unauthenticated,
 * `false` once it has been deleted. Lets the client sign itself out instead of
 * waiting for the access token to expire.
 */
export const isAccountActive = query({
  args: {},
  returns: v.union(v.boolean(), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return !!user && user.deletedAt === undefined;
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const caller = await getActiveUser(ctx);
    if (!caller) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.deletedAt !== undefined) return null;
    return { ...user, isOwner: isAppOwner(user.email) };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const orgCtx = await getActiveOrgContext(ctx);
    if (!orgCtx) return [];
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org", (q) => q.eq("orgId", orgCtx.orgId))
      .collect();
    const users = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (!user || user.deletedAt !== undefined) continue;
      users.push(user);
    }
    return users;
  },
});

export const acceptLegal = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    const now = Date.now();
    await ctx.db.patch(user._id, {
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
    });
    return null;
  },
});

export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);

    const patch: Partial<{ name: string; bio: string }> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.bio !== undefined) patch.bio = args.bio;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }
    return null;
  },
});

/** Drops the file behind the current avatar, if the avatar was an upload. */
async function releaseAvatarUpload(
  ctx: MutationCtx,
  user: Doc<"users">,
): Promise<void> {
  if (!user.avatarStorageId) return;
  await ctx.storage.delete(user.avatarStorageId);
}

/** Short-lived URL the browser POSTs the image straight to. */
export const generateAvatarUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireActiveUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Points the avatar at a freshly uploaded file. Convex serving URLs are stable
 * for the life of the file, so the resolved URL is stored on the user and every
 * existing avatar reader keeps working unchanged.
 */
export const setUploadedAvatar = mutation({
  args: { storageId: v.id("_storage") },
  returns: v.string(),
  handler: async (ctx, { storageId }) => {
    const user = await requireActiveUser(ctx);

    const metadata = await ctx.db.system.get(storageId);
    if (!metadata) throw new Error("Upload not found");

    const allowedTypes: readonly string[] = AVATAR_ALLOWED_TYPES;
    if (!metadata.contentType || !allowedTypes.includes(metadata.contentType)) {
      await ctx.storage.delete(storageId);
      throw new Error("Unsupported image type. Use PNG, JPEG, WebP, or GIF.");
    }
    if (metadata.size > AVATAR_MAX_BYTES) {
      await ctx.storage.delete(storageId);
      throw new Error("Image is too large");
    }

    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      await ctx.storage.delete(storageId);
      throw new Error("Upload could not be read back");
    }

    await releaseAvatarUpload(ctx, user);
    await ctx.db.patch(user._id, { avatar: url, avatarStorageId: storageId });
    return url;
  },
});

export const setPresetAvatar = mutation({
  args: { src: v.string() },
  returns: v.null(),
  handler: async (ctx, { src }) => {
    const user = await requireActiveUser(ctx);
    if (!isAvatarPresetSrc(src)) throw new Error("Unknown avatar");

    await releaseAvatarUpload(ctx, user);
    await ctx.db.patch(user._id, { avatar: src, avatarStorageId: undefined });
    return null;
  },
});

/** Falls back to initials. Also clears an OAuth picture inherited at sign-up. */
export const clearAvatar = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    await releaseAvatarUpload(ctx, user);
    await ctx.db.patch(user._id, {
      avatar: undefined,
      avatarStorageId: undefined,
      image: undefined,
    });
    return null;
  },
});

/**
 * Deletes an account: your own when `userId` is omitted, or another member's
 * when the app owner passes their id. The owner account itself can't be
 * deleted, so the crew can never be left without an admin.
 */
export const deleteAccount = mutation({
  args: { userId: v.optional(v.id("users")) },
  returns: v.null(),
  handler: async (ctx, { userId }) => {
    const caller = await requireActiveUser(ctx);
    const targetId = userId ?? caller._id;

    if (targetId !== caller._id && !isAppOwner(caller.email)) {
      throw new Error("Only the owner can delete another member's account");
    }

    const target = await ctx.db.get(targetId);
    if (!target || target.deletedAt !== undefined) {
      throw new Error("Account not found");
    }
    if (isAppOwner(target.email)) {
      throw new Error("The owner account can't be deleted");
    }

    await deleteAccountForUser(ctx, targetId);
    return null;
  },
});
