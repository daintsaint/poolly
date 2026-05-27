import { BNav, BFooter } from "@/components/vault-ui";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Poolly",
  description: "Poolly Terms of Service. Read our terms before joining or hosting subscription pools.",
};

const EFFECTIVE = "1 June 2026";

const sections = [
  {
    heading: "1. About Poolly",
    body: `Poolly is a beta-stage platform that enables users to collectively purchase and share access to digital subscription services using the Solana blockchain. Poolly Labs ("we", "us", "our") operates this platform on a non-custodial basis — your funds are held in a smart contract escrow, not by Poolly Labs.`,
  },
  {
    heading: "2. Acceptance of Terms",
    body: `By connecting a wallet and using Poolly, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the platform. We may update these Terms at any time; continued use following notice of updates constitutes acceptance.`,
  },
  {
    heading: "3. Eligibility",
    body: `You must be at least 18 years old and legally permitted to enter binding agreements in your jurisdiction. Poolly is not currently available where prohibited by law. You are solely responsible for compliance with local regulations regarding cryptocurrency transactions and service sharing.`,
  },
  {
    heading: "4. Subscription Pools",
    body: `Pools are created by "Hosts" who establish a subscription-sharing arrangement for a specific service. Members join by committing USDC into an on-chain escrow. Poolly does not guarantee the continued availability of any underlying subscription service, nor does it verify that Hosts maintain valid subscriptions. Use of shared credentials may violate the terms of the underlying service — you are responsible for reviewing those terms.`,
  },
  {
    heading: "5. Payments & Fees",
    body: `All payments are denominated in USDC on the Solana devnet (testnet during beta) or mainnet as indicated in the interface. A platform fee of 6% is deducted at fund release. Solana network fees ("gas") are paid by users. Poolly Labs is not a payment processor, exchange, or custodian. Funds are held in a non-upgradeable smart contract at program address Edv6BNFLKPKJ4KUWco2MEmGSTsdSU4xBWFsaFFmezpcq.`,
  },
  {
    heading: "6. No Financial Advice",
    body: `Nothing on Poolly constitutes financial, investment, legal, or tax advice. Cryptocurrency assets are volatile and unregulated in many jurisdictions. You bear all risk of loss from using the platform. Poolly Labs is not liable for any financial losses arising from smart contract bugs, network conditions, or market events.`,
  },
  {
    heading: "7. Smart Contract Risk",
    body: `The Poolly escrow program is open-source and has been reviewed internally, but has not received a formal third-party security audit as of the effective date. You acknowledge that smart contracts may contain bugs or vulnerabilities. During the beta period, use the platform only with funds you are prepared to lose.`,
  },
  {
    heading: "8. Prohibited Conduct",
    body: `You agree not to: (a) use Poolly for pools covering illegal content or services; (b) create fake or misleading pool listings; (c) attempt to exploit, hack, or front-run the smart contract; (d) use Poolly to launder funds or evade sanctions; (e) impersonate Poolly Labs or other users.`,
  },
  {
    heading: "9. Intellectual Property",
    body: `All Poolly trademarks, logos, and software are owned by Poolly Labs. Service marks (Netflix, Spotify, etc.) are the property of their respective owners. Reference to third-party services does not imply endorsement or affiliation.`,
  },
  {
    heading: "10. Disclaimers & Limitation of Liability",
    body: `THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, POOLLY LABS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED $100 USD.`,
  },
  {
    heading: "11. Governing Law",
    body: `These Terms are governed by the laws of England and Wales. Any disputes shall be resolved by binding arbitration under the LCIA rules, except either party may seek injunctive relief in a court of competent jurisdiction.`,
  },
  {
    heading: "12. Contact",
    body: `For legal enquiries: legal@poolly.xyz (response time may vary during beta). For technical support, use the in-app chat or join our Discord.`,
  },
];

export default function TermsPage() {
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
            Terms of Service
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
              href="/legal/privacy"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                color: "var(--b-paper-40)",
                textDecoration: "none",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Privacy Policy →
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
