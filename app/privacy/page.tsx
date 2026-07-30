import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal-shell";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_MAILTO,
  SITE_OPERATOR_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy · Movie Night",
  description:
    "How Movie Night collects, uses, and protects your information when you sign in and use the app.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="July 30, 2026">
      <p>
        Movie Night (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) helps small
        groups plan movie nights, share a watchlist, and rate films together. This
        Privacy Policy explains what information we collect, why we collect it, and
        how you can control it. By using Movie Night, you agree to this policy.
      </p>

      <LegalSection title="Who we are">
        <p>
          Movie Night is a personal project operated solely by{" "}
          <span className="text-foreground">{SITE_OPERATOR_NAME}</span>. Contact:{" "}
          <a
            href={SITE_CONTACT_MAILTO}
            className="text-foreground underline underline-offset-2"
          >
            {SITE_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>Depending on how you sign in and use the app, we may collect:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Account details: name, email address, and profile photo from Google
            Sign-In, or your email address when you use email one-time codes.
          </li>
          <li>
            App activity: watchlist entries, votes, movie nights, ratings, notes,
            collections, and related preferences you create in the product.
          </li>
          <li>
            Technical data: basic logs needed to run and secure the service
            (for example authentication events and error diagnostics).
          </li>
        </ul>
        <p>
          Movie metadata (titles, posters, overviews) is fetched from The Movie
          Database (TMDB). TMDB content is subject to TMDB&apos;s own terms and
          privacy practices.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <ul className="list-disc space-y-1 pl-5">
          <li>Authenticate you and keep your session secure.</li>
          <li>Provide collaborative features for your movie group.</li>
          <li>Send transactional emails such as sign-in codes and night reminders.</li>
          <li>Maintain, debug, and improve the service.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="Google Sign-In">
        <p>
          If you choose &quot;Continue with Google,&quot; Google shares basic
          profile information with us (such as your name, email, and profile
          image) according to your Google account settings. We use that data only
          to create and manage your Movie Night account. You can revoke access
          anytime in your Google Account permissions.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          We rely on trusted processors to operate Movie Night, including hosting,
          database, authentication, and email delivery providers. They process data
          only to provide their services to us and under appropriate safeguards.
        </p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          We keep account and app data while your account is active. You may
          request deletion of your account and associated personal data by
          emailing{" "}
          <a
            href={SITE_CONTACT_MAILTO}
            className="text-foreground underline underline-offset-2"
          >
            {SITE_CONTACT_EMAIL}
          </a>
          . Some records may remain briefly in backups or logs as required for
          security and legal compliance.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>Update profile information inside the app where available.</li>
          <li>Disconnect Google access from your Google Account settings.</li>
          <li>Request access, correction, or deletion by contacting us.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Movie Night is not directed to children under 13, and we do not
          knowingly collect personal information from children under 13.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last
          updated&quot; date at the top will change when we do. Continued use of
          Movie Night after an update means you accept the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about privacy:{" "}
          <a
            href={SITE_CONTACT_MAILTO}
            className="text-foreground underline underline-offset-2"
          >
            {SITE_CONTACT_EMAIL}
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
