/**
 * Sign-in code email. Rendered as table-based HTML with inline styles so it
 * survives Outlook and Gmail, which strip <style> blocks and ignore webfonts.
 */

const INK = {
  page: "#171310",
  card: "#221c19",
  border: "#3a322e",
  text: "#f2efec",
  muted: "#a2988f",
  accent: "#d1503c",
} as const;

const MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

export type OtpEmailParams = {
  token: string;
  expiresInMinutes: number;
  siteUrl: string;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

function hostFrom(siteUrl: string): string {
  try {
    return new URL(siteUrl).host;
  } catch {
    return siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export function renderOtpEmail({
  token,
  expiresInMinutes,
  siteUrl,
}: OtpEmailParams): RenderedEmail {
  const host = hostFrom(siteUrl);
  const subject = `${token} — your MOVINIGHT sign-in code`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${INK.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
Your sign-in code is ${token}. It expires in ${expiresInMinutes} minutes.
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${INK.page};">
<tr>
<td align="center" style="padding:40px 16px;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:440px;background-color:${INK.card};border:1px solid ${INK.border};">

<tr><td style="height:2px;background-color:${INK.accent};line-height:2px;font-size:0;">&nbsp;</td></tr>

<tr>
<td style="padding:30px 32px 0 32px;">
<p style="margin:0;font-family:${MONO};font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:${INK.text};">
Movie&nbsp;Night
</p>
<p style="margin:6px 0 0 0;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${INK.muted};">
Admit one
</p>
</td>
</tr>

<tr><td style="padding:24px 32px 0 32px;"><div style="height:1px;background-color:${INK.border};line-height:1px;font-size:0;">&nbsp;</div></td></tr>

<tr>
<td align="center" style="padding:30px 32px 26px 32px;">
<p style="margin:0 0 16px 0;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${INK.muted};">
Sign-in code
</p>
<p style="margin:0;font-family:${MONO};font-size:34px;font-weight:700;letter-spacing:0.26em;text-indent:0.26em;color:${INK.text};">
${token}
</p>
<p style="margin:18px 0 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.08em;color:${INK.muted};">
Expires in ${expiresInMinutes} minutes
</p>
</td>
</tr>

<tr><td style="padding:0 32px;"><div style="height:1px;background-color:${INK.border};line-height:1px;font-size:0;">&nbsp;</div></td></tr>

<tr>
<td style="padding:20px 32px 30px 32px;">
<p style="margin:0;font-family:${MONO};font-size:11px;line-height:1.7;color:${INK.muted};">
Didn't ask for this? Ignore the email — nobody gets in without the code.
</p>
</td>
</tr>

</table>

<p style="margin:18px 0 0 0;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${INK.muted};">
${host}
</p>

</td>
</tr>
</table>
</body>
</html>`;

  const text = [
    "MOVINIGHT — ADMIT ONE",
    "",
    `Sign-in code: ${token}`,
    `Expires in ${expiresInMinutes} minutes.`,
    "",
    "Didn't ask for this? Ignore the email — nobody gets in without the code.",
    "",
    host,
  ].join("\n");

  return { subject, html, text };
}
