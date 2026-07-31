import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import Google from "@auth/core/providers/google";
import { renderOtpEmail } from "./lib/otpEmail";

/** Token lifetime, shared with the email copy so the two can't drift. */
const OTP_TTL_SECONDS = 60 * 60;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Email({
      id: "email-otp",
      maxAge: OTP_TTL_SECONDS,
      generateVerificationToken: async () => {
        return String(Math.floor(100000 + Math.random() * 900000));
      },
      sendVerificationRequest: async ({ identifier: email, token }) => {
        const apiKey = process.env.AUTH_RESEND_KEY;
        if (!apiKey) throw new Error("AUTH_RESEND_KEY is not set");

        const from =
          process.env.AUTH_RESEND_FROM ?? "Movie Night <onboarding@resend.dev>";

        const { subject, html, text } = renderOtpEmail({
          token,
          expiresInMinutes: OTP_TTL_SECONDS / 60,
          siteUrl: process.env.SITE_URL ?? "https://www.whopickedthis.app",
        });

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [email],
            subject,
            html,
            text,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          console.error("Resend OTP send failed", {
            status: res.status,
            body,
            from,
          });
          throw new Error(`Failed to send email: ${body}`);
        }
      },
    }),
    Google,
  ],
});
