/**
 * Organization invite email (Resend). Table-based HTML for Outlook/Gmail.
 */

const INK = {
  page: "#171310",
  card: "#221c19",
  border: "#3a322e",
  text: "#f2efec",
  muted: "#a2988f",
  accent: "#d1503c",
} as const;

export type InviteEmailParams = {
  orgName: string;
  inviterName: string;
  inviteUrl: string;
  expiresInDays: number;
};

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export function renderInviteEmail({
  orgName,
  inviterName,
  inviteUrl,
  expiresInDays,
}: InviteEmailParams): RenderedEmail {
  const subject = `Join ${orgName} on Movie Night`;
  const safeOrg = escapeHtml(orgName);
  const safeInviter = escapeHtml(inviterName);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:${INK.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${INK.page};">
<tr>
<td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:${INK.card};border:1px solid ${INK.border};border-radius:12px;">
<tr><td style="padding:32px 28px;">
<p style="margin:0 0 12px;font-family:system-ui,sans-serif;font-size:13px;color:${INK.muted};">Movie Night</p>
<h1 style="margin:0 0 16px;font-family:system-ui,sans-serif;font-size:22px;color:${INK.text};">You're invited</h1>
<p style="margin:0 0 20px;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:${INK.muted};">
<strong style="color:${INK.text};">${safeInviter}</strong> invited you to join
<strong style="color:${INK.text};">${safeOrg}</strong>.
</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="background-color:${INK.accent};border-radius:8px;">
<a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;color:#fff;text-decoration:none;">Accept invitation</a>
</td>
</tr></table>
<p style="margin:24px 0 0;font-family:system-ui,sans-serif;font-size:12px;line-height:1.5;color:${INK.muted};">
This link expires in ${expiresInDays} days. If you didn't expect this, you can ignore the email.
</p>
</td></tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  const text = `${inviterName} invited you to join ${orgName} on Movie Night.

Accept: ${inviteUrl}

This link expires in ${expiresInDays} days.`;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
