import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const namespaces = [
  "common",
  "nav",
  "auth",
  "onboarding",
  "dashboard",
  "watchlist",
  "watched",
  "calendar",
  "nights",
  "members",
  "food",
  "collections",
  "hallOfFame",
  "legal",
  "empty",
  "org",
  "cookies",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  const messages: Record<string, unknown> = {};
  await Promise.all(
    namespaces.map(async (ns) => {
      const mod = await import(`../messages/${locale}/${ns}.json`);
      messages[ns] = mod.default;
    }),
  );

  return {
    locale,
    messages,
  };
});
