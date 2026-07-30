import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SITE_CONTACT_EMAIL, SITE_CONTACT_MAILTO } from "@/lib/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-stage relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="auth-stage-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="auth-stage-grain pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8 sm:px-8 sm:py-10">
        <header className="auth-enter flex flex-col items-center text-center">
          <BrandLogo className="h-20 sm:h-24" priority />
          <p className="mt-4 max-w-[22rem] font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Private screenings · Shared watchlist
          </p>
        </header>

        <main className="auth-enter-delay flex flex-1 flex-col justify-center py-10">
          {children}
        </main>

        <footer className="auth-enter-delay-2 space-y-3 border-t border-border/70 pt-5 text-center">
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
          >
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
          <p className="text-[11px] text-muted-foreground/80">
            Movie Night · Contact{" "}
            <a
              href={SITE_CONTACT_MAILTO}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              {SITE_CONTACT_EMAIL}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
