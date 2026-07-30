import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { AUTH_DISABLED } from "@/lib/auth-flags";

const isPublicPage = createRouteMatcher([
  "/login",
  "/register",
  "/privacy",
  "/terms",
  "/about",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (AUTH_DISABLED) return;

  const isAuthenticated = await convexAuth.isAuthenticated();
  const path = request.nextUrl.pathname;
  const isAuthEntry = path === "/login" || path === "/register";

  // Authenticated users should not see login/register — redirect server-side
  // instead of a client useEffect (avoids a flash of the wrong page).
  if (isAuthEntry && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/");
  }

  if (!isPublicPage(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
