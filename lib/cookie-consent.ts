const STORAGE_KEY = "movie-night-cookie-consent";
const EVENT = "movie-night-cookie-consent";

export type CookieConsent = {
  necessary: true;
  optional: boolean;
  updatedAt: number;
};

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed?.necessary !== true || typeof parsed.optional !== "boolean") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCookieConsent(consent: CookieConsent): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeCookieConsent(onStoreChange: () => void): () => void {
  window.addEventListener(EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Gate optional third-party scripts until the user opts in. */
export function hasOptionalCookieConsent(): boolean {
  return getCookieConsent()?.optional === true;
}
