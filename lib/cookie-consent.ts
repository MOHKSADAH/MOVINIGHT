const STORAGE_KEY = "movie-night-cookie-consent";
const EVENT = "movie-night-cookie-consent";

export type CookieConsent = {
  necessary: true;
  optional: boolean;
  updatedAt: number;
};

/** Cached so useSyncExternalStore getSnapshot returns a stable reference. */
let cachedRaw: string | null | undefined;
let cachedConsent: CookieConsent | null = null;

function parseConsent(raw: string | null): CookieConsent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed?.necessary !== true || typeof parsed.optional !== "boolean") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readConsentFromStorage(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedConsent;
  cachedRaw = raw;
  cachedConsent = parseConsent(raw);
  return cachedConsent;
}

export function getCookieConsent(): CookieConsent | null {
  return readConsentFromStorage();
}

/**
 * Snapshot for useSyncExternalStore — must return the same reference when the
 * underlying store value has not changed (React 19 requirement).
 */
export function getCookieConsentSnapshot(): CookieConsent | null {
  return readConsentFromStorage();
}

export function getCookieConsentServerSnapshot(): CookieConsent | null {
  return null;
}

export function setCookieConsent(consent: CookieConsent): void {
  const raw = JSON.stringify(consent);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedConsent = consent;
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeCookieConsent(onStoreChange: () => void): () => void {
  const handle = () => {
    // Invalidate cache so the next snapshot read sees fresh storage
    // (e.g. cross-tab `storage` events).
    cachedRaw = undefined;
    onStoreChange();
  };
  window.addEventListener(EVENT, handle);
  window.addEventListener("storage", handle);
  return () => {
    window.removeEventListener(EVENT, handle);
    window.removeEventListener("storage", handle);
  };
}

/** Gate optional third-party scripts until the user opts in. */
export function hasOptionalCookieConsent(): boolean {
  return getCookieConsent()?.optional === true;
}
