import { BNav, BFooter } from "@/components/vault-ui";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Poolly",
  description: "Poolly Privacy Policy. Understand how we handle your data on a non-custodial blockchain platform.",
};

const EFFECTIVE = "1 June 2026";

const sections = [
  {
    heading: "1. Overview",
    body: `Poolly Labs ("we", "us", "our") operates Poolly, a non-custodial subscription pooling platform built on the Solana blockchain. This Privacy Policy explains what data we collect, how we use it, and your rights. Because Poolly is non-custodial, the majority of your activity is recorded on-chain and is publicly visible by design.`,
  },
  {
    heading: "2. Data We Collect",
    body: `On-chain data (public): Your Solana wallet address, pool memberships, payment transactions, and any data you write to the blockchain. This is permanently public and cannot be deleted.\n\nOff-chain data we store: (a) Display names — if you set a display name via the platform, we store the mapping of wallet → display name in our database. (b) AI feature usage — queries sent to our AI features (Smart Bundle, Negotiator, Member Health AI) are processed via third-party APIs (Groq) and are not permanently stored by us beyond the current session. (c) Server logs — standard request logs (IP address, timestamp, endpoint) retained for up to 30 days for security and debugging.`,
  },
  {
    heading: "3. Data We Do Not Collect",
    body: `We do not collect: real names, email addresses, government IDs, payment card details, or any personally identifying information beyond what you voluntarily provide (e.g., a display name). We do not use cookies for tracking or advertising. We do not sell data to third parties.`,
  },
  {
    heading: "4. How We Use Your Data",
    body: `Display names are used solely to improve readability in the platform UI. Server logs are used for security monitoring, abuse prevention, and debugging. AI queries are forwarded to Groq (our LLM provider) in real time and processed subject to Groq's own privacy policy; we do not store the content of these queries after the response is delivered.`,
  },
  {
    heading: "5. Third-Party Services",
    body: `We use the following third parties: Groq (AI inference — groq.com/privacy), Upstash (Redis KV store for display names — upstash.com/privacy), Solana RPC providers (Helius or public devnet) for blockchain data. We do not use Google Analytics, Meta Pixel, or any behavioural advertising trackers.`,
  },
  {
    heading: "6. Blockchain Data",
    body: `Any data written to the Solana blockchain — including your wallet address, transactions, and pool activity — is immutable and publicly accessible. Poolly Labs has no ability to modify or delete on-chain data. If you require privacy from on-chain observers, consider using a fresh wallet address.`,
  },
  {
    heading: "7. Your Rights",
    body: `If you are located in the EEA, UK, or a jurisdiction with applicable privacy law, you may have the right to: access the off-chain data we hold about you (primarily your display name); request deletion of your display name from our database; object to any processing. To exercise these rights, contact us at privacy@poolly.xyz. Note that we cannot fulfil deletion requests for data recorded on the Solana blockchain.`,
  },
  {
    heading: "8. Data Retention",
    body: `Display names are retained until you delete your account or request deletion. Server logs are retained for 30 days. AI query content is not retained beyond the response lifecycle. We will delete your off-chain data within 30 days of a verified request.`,
  },
  {
    heading: "9. Security",
    body: `Display names are stored in an encrypted Redis instance with token-based authentication. AI API calls use TLS in transit. No sensitive financial data passes through our servers — all USDC transactions happen directly on-chain between your wallet and the escrow smart contract. We implement rate limiting on all public API endpoints to prevent abuse.`,
  },
  {
    heading: "10. Children",
    body: `Poolly is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has used the platform, contact us at privacy@poolly.xyz.`,
  },
  {
    heading: "11. Changes to This Policy",
    body: `We may update this policy as the platform evolves. Material changes will be announced via the platform interface. Continued use after notice constitutes acceptance.`,
  },
  {
    heading: "12. Contact",
    body: `Privacy enquiries: privacy@poolly.xyz. Poolly Labs, London, UK. We aim to respond within 10 business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <BNav />
      <main style={{ background: "var(--b-ink)", minHeight: "100vh" }}>
        <div
          className="page-x"
          style={{
            maxWidth: 760,
            margin: "0 auto",
            paddingTop: "clamp(3rem, 8vw, 80px)",
            paddingBottom: "clamp(3rem, 8vw, 80px)",
          }}
        >
          {/* Header */}
          <p className="b-eyebrow" style={{ marginBottom: 20 }}>Legal</p>
          <h1
            className="b-serif b-italic"
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              color: "var(--b-paper)",
              marginBottom: 12,
              lineHeight: 1.1,
            }}
          >
            Privacy Policy
          </h1>
          <p
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 12,
              color: "var(--b-paper-40)",
              letterSpacing: "0.12em",
              marginBottom: 48,
            }}
          >
            Effective {EFFECTIVE} · Beta Platform
          </p>

          <div
            style={{
              borderTop: "1px solid var(--b-rule)",
              paddingTop: 48,
              display: "flex",
              flexDirection: "column",
              gap: 40,
            }}
          >
            {sections.map((s) => (
              <section key={s.heading}>
                <h2
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--b-gold)",
                    marginBottom: 12,
                  }}
                >
                  {s.heading}
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-geist), sans-serif",
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: "var(--b-paper-60)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {s.body}
                </p>
              </section>
            ))}
          </div>

          {/* Footer nav */}
          <div
            style={{
              borderTop: "1px solid var(--b-rule)",
              marginTop: 56,
              paddingTop: 24,
              display: "flex",
              gap: 24,
            }}
          >
            <Link
              href="/legal/terms"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                color: "var(--b-paper-40)",
                textDecoration: "none",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Terms of Service →
            </Link>
            <Link
              href="/"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                color: "var(--b-paper-40)",
                textDecoration: "none",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Back to Home →
            </Link>
          </div>
        </div>
      </main>
      <BFooter />
    </>
  );
}
