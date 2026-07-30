import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, LegalSection } from "@/components/legal-shell";
import { Button } from "@/components/ui/button";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_MAILTO,
  SITE_OPERATOR_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "About · Movie Night",
  description:
    "Movie Night is a private group app for planning nights, voting on films, and keeping score together.",
};

export default function AboutPage() {
  return (
    <LegalShell title="About Movie Night" updated="July 30, 2026">
      <p className="text-foreground">
        Movie Night is a small-group film club in your browser: one shared
        watchlist, scheduled nights, votes, and ratings that stay with your crew.
      </p>

      <LegalSection title="What we build for">
        <ul className="list-disc space-y-1 pl-5">
          <li>Friends who pick films together instead of doomscrolling alone.</li>
          <li>Recurring nights that need a calendar, shortlist, and scoreboard.</li>
          <li>A private space, not a public social network.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Operator">
        <p>
          Movie Night is operated solely by{" "}
          <span className="text-foreground">{SITE_OPERATOR_NAME}</span>. Contact:{" "}
          <a
            href={SITE_CONTACT_MAILTO}
            className="text-foreground underline underline-offset-2"
          >
            {SITE_CONTACT_EMAIL}
          </a>
          .
        </p>
        <p>
          This About page, our{" "}
          <Link href="/privacy" className="text-foreground underline underline-offset-2">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/terms" className="text-foreground underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          support Google OAuth brand verification and transparent use of Sign-In
          with Google.
        </p>
      </LegalSection>

      <LegalSection title="Movie data">
        <p>
          Film titles, posters, and overviews are provided by{" "}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-2"
          >
            TMDB
          </a>
          . Movie Night is not endorsed or certified by TMDB.
        </p>
      </LegalSection>

      <div className="pt-2">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </LegalShell>
  );
}
