import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal-shell";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_MAILTO,
  SITE_OPERATOR_NAME,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service · Movie Night",
  description:
    "Terms governing your use of Movie Night for shared watchlists, nights, and ratings.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="July 30, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of Movie Night, operated solely by {SITE_OPERATOR_NAME}. By creating an
        account or using the app, you agree to these Terms. If you do not agree,
        do not use Movie Night.
      </p>

      <LegalSection title="The service">
        <p>
          Movie Night is a collaborative web app for planning movie nights,
          managing a shared watchlist, voting on films, and recording ratings with
          a small group. Features may change as we improve the product.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You must provide accurate information when signing in with Google or
          email. You are responsible for activity under your account and for
          keeping access to your email or Google account secure. Notify us if you
          suspect unauthorized use.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>Use Movie Night only for lawful, personal or small-group purposes.</li>
          <li>Do not abuse, disrupt, or reverse-engineer the service.</li>
          <li>Do not upload unlawful, harassing, or infringing content.</li>
          <li>Do not attempt to access another user&apos;s account without permission.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You retain rights to content you submit (such as notes, lists, and
          ratings). You grant us a limited license to host and display that
          content so the app can function for you and your group. Movie artwork
          and metadata from TMDB remain subject to TMDB&apos;s terms.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          Sign-in may use Google and email delivery providers. Movie data may come
          from TMDB. Those services have their own terms and privacy policies,
          and we are not responsible for their independent practices.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          We aim to keep Movie Night available, but we do not guarantee
          uninterrupted or error-free operation. We may suspend or discontinue
          features with reasonable notice when practical.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          Movie Night is provided &quot;as is&quot; without warranties of any
          kind, express or implied, to the fullest extent permitted by law. We
          are not liable for indirect, incidental, or consequential damages
          arising from your use of the service.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may stop using Movie Night at any time. We may suspend or terminate
          access if you violate these Terms or if we need to protect the service
          or other users. You may request account deletion by contacting{" "}
          <a
            href={SITE_CONTACT_MAILTO}
            className="text-foreground underline underline-offset-2"
          >
            {SITE_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Changes to these Terms">
        <p>
          We may update these Terms periodically. The &quot;Last updated&quot;
          date will change when we do. Continued use after changes means you
          accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms:{" "}
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
