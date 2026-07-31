/**
 * Writes the sign-in code email to .preview/otp-email.html so the template can
 * be eyeballed in a browser without sending mail.
 *
 * Run: node scripts/preview-otp-email.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderOtpEmail } from "../convex/lib/otpEmail.ts";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(projectRoot, ".preview");

const { subject, html, text } = renderOtpEmail({
  token: "429183",
  expiresInMinutes: 60,
  siteUrl: "https://www.whopickedthis.app",
});

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "otp-email.html"), html, "utf8");
writeFileSync(join(outDir, "otp-email.txt"), `${subject}\n\n${text}\n`, "utf8");

console.log(`subject: ${subject}`);
console.log(`wrote:   ${join(outDir, "otp-email.html")}`);
