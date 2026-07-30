import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { AUTH_DISABLED } from "@/lib/auth-flags";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/privacy",
  "/terms",
  "/about",
]);

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (locale === routing.defaultLocale) continue;
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length) || "/";
    }
  }
  return pathname;
}

function localeFromPath(pathname: string): string {
  const segment = pathname.split("/")[1];
  if (
    segment &&
    (routing.locales as readonly string[]).includes(segment) &&
    segment !== routing.defaultLocale
  ) {
    return segment;
  }
  return routing.defaultLocale;
}

function withLocale(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return path;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (AUTH_DISABLED) {
    return handleI18nRouting(request);
  }

  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = stripLocale(pathname);
  const locale = localeFromPath(pathname);
  const isAuthEntry =
    pathWithoutLocale === "/login" || pathWithoutLocale === "/register";
  const isAuthenticated = await convexAuth.isAuthenticated();

  if (isAuthEntry && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, withLocale("/", locale));
  }

  if (!PUBLIC_PATHS.has(pathWithoutLocale) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, withLocale("/login", locale));
  }

  return handleI18nRouting(request);
});

export const config = {
  // Exclude most /api routes from i18n, but /api/auth MUST hit the proxy —
  // Convex Auth proxies signIn/signOut there. Without it, OTP posts get a Next 404.
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    "/api/auth",
  ],
};
