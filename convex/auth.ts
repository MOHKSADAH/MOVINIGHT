import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Email({
      id: "email-otp",
      generateVerificationToken: async () => {
        return String(Math.floor(100000 + Math.random() * 900000));
      },
      sendVerificationRequest: async ({ identifier: email, token }) => {
        const apiKey = process.env.AUTH_RESEND_KEY;
        if (!apiKey) throw new Error("AUTH_RESEND_KEY is not set");

        const from = process.env.AUTH_RESEND_FROM ?? "Movie Night <onboarding@resend.dev>";

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [email],
            subject: "Your Movie Night sign-in code",
            html: `
              <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
                <h2 style="margin:0 0 8px">Movie Night</h2>
                <p style="color:#666;margin:0 0 24px">Your sign-in code:</p>
                <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f5f5f5;border-radius:8px">
                  ${token}
                </div>
                <p style="color:#999;font-size:12px;margin-top:24px">
                  This code expires in 1 hour. If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            `,
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
