// Server-only email helper using Resend
// Requires RESEND_API_KEY env var
// TODO: Wire up once member email collection is added

import { Resend } from "resend";

const client = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = "Poolly <noreply@poolly.app>";

export async function sendProofSubmittedEmail(to: string, poolTitle: string, hostName: string) {
  if (!client) return;
  await client.emails.send({
    from: FROM,
    to,
    subject: `Proof submitted for ${poolTitle}`,
    html: `<p>The host <strong>${hostName}</strong> has submitted proof of delivery for <strong>${poolTitle}</strong>. Funds will be released shortly.</p>`,
  }).catch(console.error);
}

export async function sendPoolClosedEmail(to: string, poolTitle: string) {
  if (!client) return;
  await client.emails.send({
    from: FROM,
    to,
    subject: `${poolTitle} has been closed`,
    html: `<p>The pool <strong>${poolTitle}</strong> has been closed by the host. You can claim your deposit refund from the pool page.</p>`,
  }).catch(console.error);
}

export async function sendDisputeFlaggedEmail(to: string, poolTitle: string) {
  if (!client) return;
  await client.emails.send({
    from: FROM,
    to,
    subject: `Dispute flagged on ${poolTitle}`,
    html: `<p>A dispute has been flagged on <strong>${poolTitle}</strong>. Fund releases are frozen pending admin review.</p>`,
  }).catch(console.error);
}
