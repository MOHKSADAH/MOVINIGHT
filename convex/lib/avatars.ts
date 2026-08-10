/**
 * Built-in avatars, served as static SVGs from `public/avatars`.
 *
 * Primary presets are curated DiceBear Lorelei illustrations (CC0 1.0 via
 * https://www.dicebear.com/styles/lorelei/). Themed homemade SVGs stay in the
 * picker as well so existing crews keep the older characters.
 *
 * Lives under `convex/` so the server can validate a chosen avatar against the
 * same list the client renders.
 */
export const AVATAR_PRESET_IDS = [
  // Lorelei
  "aria",
  "blake",
  "casey",
  "devon",
  "ellis",
  "finn",
  "harper",
  "indie",
  "jules",
  "kai",
  "lane",
  "morgan",
  "nova",
  "orion",
  "quinn",
  "remy",
  "sage",
  "taylor",
  "vale",
  "west",
  // Themed
  "noir",
  "kaiju",
  "android",
  "vampire",
  "astronaut",
  "cowboy",
  "samurai",
  "ghost",
  "alien",
  "diver",
  "wizard",
  "slasher",
  "pirate",
  "ninja",
  "mummy",
  "werewolf",
  "cyborg",
  "clown",
  "ranger",
  "mech",
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESET_IDS)[number];

export function avatarPresetSrc(id: AvatarPresetId): string {
  return `/avatars/${id}.svg`;
}

export const AVATAR_PRESETS: { id: AvatarPresetId; src: string }[] =
  AVATAR_PRESET_IDS.map((id) => ({ id, src: avatarPresetSrc(id) }));

/** How many presets to show before the "View more" control. */
export const AVATAR_PRESETS_COLLAPSED_COUNT = 5;

const PRESET_SOURCES = new Set(AVATAR_PRESETS.map((preset) => preset.src));

export function isAvatarPresetSrc(src: string): boolean {
  return PRESET_SOURCES.has(src);
}

/** Upload limits, enforced on the client for feedback and on the server for real. */
export const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
