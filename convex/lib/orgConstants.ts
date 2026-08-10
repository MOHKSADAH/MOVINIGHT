import { v } from "convex/values";

/** Bump when Terms / Privacy text materially changes to re-prompt acceptance. */
export const TERMS_VERSION = "2026-08-09";
export const PRIVACY_VERSION = "2026-08-09";

export const DEFAULT_ORG_CODE = "weebs";
export const DEFAULT_ORG_NAME = "Weebs";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const orgRoleValidator = v.union(
  v.literal("owner"),
  v.literal("member"),
);

export function normalizeOrgCode(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export function isValidOrgCode(code: string): boolean {
  return code.length >= 3 && code.length <= 32;
}
