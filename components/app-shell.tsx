"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { OrgSwitcher } from "@/components/org-switcher";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  List,
  Eye,
  CalendarDays,
  LogOut,
  LayoutDashboard,
  Moon,
  Sun,
  BookMarked,
  Crown,
  PanelLeftClose,
  PanelLeft,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTH_DISABLED } from "@/lib/auth-flags";

const navItems = [
  { href: "/", labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/watchlist", labelKey: "watchlist" as const, icon: List },
  { href: "/watched", labelKey: "watched" as const, icon: Eye },
  { href: "/calendar", labelKey: "calendar" as const, icon: CalendarDays },
  { href: "/collections", labelKey: "collections" as const, icon: BookMarked },
  { href: "/hall-of-fame", labelKey: "hallOfFame" as const, icon: Trophy },
];

const SIDEBAR_KEY = "sidebarCollapsed";
const THEME_EVENT = "movie-night-theme";
const SIDEBAR_EVENT = "movie-night-sidebar";

function subscribeTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener(THEME_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    observer.disconnect();
    window.removeEventListener(THEME_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerThemeSnapshot() {
  return true;
}

function subscribeSidebar(onStoreChange: () => void) {
  window.addEventListener(SIDEBAR_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSidebarSnapshot() {
  return localStorage.getItem(SIDEBAR_KEY) === "true";
}

function getServerSidebarSnapshot() {
  return false;
}

function LoadingScreen() {
  const t = useTranslations("nav");
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 border-e border-sidebar-border bg-sidebar shadow-sm">
        <div className="flex h-24 items-center justify-center px-5 border-b border-sidebar-border">
          <BrandLogo className="h-16" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <div
              key={item.href}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 md:ms-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo className="h-12 opacity-70 animate-pulse" />
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </main>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.users.getCurrentUser);
  const accountActive = useQuery(api.users.isAccountActive);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  // An access token stays valid for up to an hour after the account is deleted,
  // so drop the session as soon as the backend reports the account is gone.
  useEffect(() => {
    if (accountActive !== false) return;
    void signOut().then(() => router.replace("/login"));
  }, [accountActive, signOut, router]);

  // Email sign-up gives us no display name, so send those users to onboarding.
  // Google users arrive with a name and skip it.
  useEffect(() => {
    if (!user || user.name?.trim()) return;
    router.replace("/onboarding");
  }, [user, router]);

  const gate = useQuery(
    api.organizations.needsOrgGate,
    user ? {} : "skip",
  );

  useEffect(() => {
    if (!user || !user.name?.trim() || gate === undefined) return;
    if (gate.needsTerms || gate.needsOrg) {
      router.replace("/join-org");
    }
  }, [user, gate, router]);

  const isDark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getServerSidebarSnapshot,
  );

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const toggleSidebar = () => {
    localStorage.setItem(SIDEBAR_KEY, String(!collapsed));
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };

  if (!AUTH_DISABLED && (isLoading || !isAuthenticated)) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 border-e border-sidebar-border bg-sidebar z-10 shadow-sm transition-[width] duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-24 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "justify-between px-3",
          )}
        >
          {!collapsed && (
            <div className="flex-1 flex justify-center">
              <BrandLogo className="h-16" priority />
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground shrink-0"
            onClick={toggleSidebar}
            aria-label={
              collapsed ? t("expandSidebar") : t("collapseSidebar")
            }
            title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className={cn("flex-1 py-4 space-y-1", collapsed ? "px-2" : "px-3")}>
          {!collapsed && <OrgSwitcher />}
          {collapsed && <OrgSwitcher collapsed />}
          {navItems.map((item) => {
            const label = t(item.labelKey);
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={label}
                className={cn(
                  "flex items-center rounded-md text-sm transition-colors",
                  collapsed
                    ? "justify-center px-0 py-2.5"
                    : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "border-t border-sidebar-border space-y-1",
            collapsed ? "p-2" : "p-4",
          )}
        >
          {user && (
            <Link
              href={`/profile/${user._id}`}
              title={user.name ?? t("myProfile")}
              className={cn(
                "flex items-center rounded-md transition-colors",
                collapsed ? "justify-center p-2" : "gap-3 px-2 py-2",
                pathname.startsWith("/profile")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50",
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatar ?? user.image ?? undefined} />
                <AvatarFallback className="text-xs">
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.name ?? t("myProfile")}
                    </p>
                    {(user as { isOwner?: boolean }).isOwner && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {t("viewProfile")}
                  </p>
                </div>
              )}
            </Link>
          )}
          <div
            className={cn(
              "flex gap-1",
              collapsed ? "flex-col items-center" : "items-center",
            )}
          >
            {!collapsed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground h-9 px-2"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4" />
                {t("signOut")}
              </Button>
            )}
            {collapsed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => void handleSignOut()}
                aria-label={t("signOut")}
                title={t("signOut")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              aria-label={
                isDark ? t("switchToLightMode") : t("switchToDarkMode")
              }
              title={isDark ? t("lightMode") : t("darkMode")}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <LanguageSwitcher
              compact
              iconOnly={collapsed}
              className={collapsed ? undefined : "ms-auto"}
            />
          </div>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 inset-x-0 h-14 border-b border-border bg-background flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-8" priority />
          <LanguageSwitcher compact />
        </div>
        {user && (
          <Link href={`/profile/${user._id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar ?? user.image ?? undefined} />
              <AvatarFallback className="text-xs">
                {user.name?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 border-t border-border bg-background flex items-center justify-around z-10">
        {navItems.slice(0, 5).map((item) => {
          const label = t(item.labelKey);
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-md transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>

      <main
        className={cn(
          "flex-1 pb-16 md:pb-0 pt-14 md:pt-0 flex flex-col transition-[margin] duration-200",
          collapsed ? "md:ms-16" : "md:ms-64",
        )}
      >
        <div className="flex-1">{children}</div>
        <footer className="py-5 text-center border-t border-border">
          <p className="text-xs text-muted-foreground">
            {tCommon("copyright", { year: new Date().getFullYear() })}
          </p>
        </footer>
      </main>
    </div>
  );
}
