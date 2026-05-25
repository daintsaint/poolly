import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

const SERVICES = [
  { icon: "📺", name: "Netflix", price: "$4.99/mo" },
  { icon: "🎵", name: "Spotify", price: "$3.99/mo" },
  { icon: "🎬", name: "Disney+", price: "$3.49/mo" },
  { icon: "💼", name: "Notion", price: "$4.00/mo" },
  { icon: "☁️", name: "iCloud+", price: "$0.99/mo" },
  { icon: "🎮", name: "Xbox GP", price: "$5.99/mo" },
  { icon: "📚", name: "Kindle", price: "$2.99/mo" },
  { icon: "🔒", name: "NordVPN", price: "$1.99/mo" },
];

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Host creates a pool",
    desc: "Set a price, minimum members, and billing cycle. Your pool goes live instantly on Solana.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 7v8M7 11h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02",
    title: "Members join & pay",
    desc: "Each member's payment locks into a smart-contract escrow on Solana. No one can touch it — not even the host.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="15" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 18c0-3 2-5 5-5h6c3 0 5 2 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "03",
    title: "Host delivers, gets paid",
    desc: "Host submits proof of delivery. Funds are released automatically — minus a 6% platform fee.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 11l5 5 9-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const TRUST_POINTS = [
  { icon: "🔐", title: "Non-custodial escrow", desc: "Funds live in a Solana smart contract. Nobody can move them without the right conditions being met." },
  { icon: "⚡", title: "Instant settlement", desc: "Payments settle in ~400ms on Solana. No waiting 3–5 business days for banks." },
  { icon: "🌍", title: "Anyone, anywhere", desc: "No bank account needed. If you have a Solana wallet, you can join any pool." },
];

export default function Home() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="hero-bg relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-24 pb-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">

            {/* Eyebrow */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", color: "#c084fc" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 pulse-ring"/>
              Built on Solana · Trustless by design
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
              <span style={{ color: "var(--text-1)" }}>Split costs.</span>
              <br />
              <span className="gradient-text">Own nothing to anyone.</span>
            </h1>

            {/* Sub */}
            <p className="animate-fade-up delay-200 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed"
              style={{ color: "var(--text-2)" }}>
              Pool subscriptions and services with anyone. Payments held in on-chain escrow — released only when you get what you paid for.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/pools" className="btn-primary flex items-center gap-2 px-7 py-3.5 text-[15px]">
                Browse Pools
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link href="/pools/create" className="btn-ghost flex items-center gap-2 px-7 py-3.5 text-[15px]">
                Create a Pool
              </Link>
            </div>

            {/* Floating service badges */}
            <div className="animate-fade-up delay-400 relative mt-12 h-32 hidden sm:block pointer-events-none select-none">
              {SERVICES.map((s, i) => {
                const positions = [
                  "left-0 top-0",       "left-[12%] top-8",
                  "left-[28%] top-1",   "left-[44%] top-10",
                  "left-[58%] top-0",   "left-[70%] top-6",
                  "left-[82%] top-2",   "right-0 top-8",
                ];
                const floatClass = ["float-a","float-b","float-c","float-a","float-b","float-c","float-a","float-b"][i];
                const delays = ["0s","1.2s","2.4s","0.6s","1.8s","3s","0.9s","2.1s"];
                return (
                  <div key={s.name}
                    className={`absolute service-badge ${positions[i]} ${floatClass}`}
                    style={{ animationDelay: delays[i] }}>
                    <span>{s.icon}</span>
                    <span style={{ color: "var(--text-1)" }}>{s.name}</span>
                    <span className="text-xs font-semibold" style={{ color: "#34d399" }}>{s.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24"
          style={{ background: "linear-gradient(to top, var(--bg-base), transparent)" }}/>
      </section>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <section className="border-y" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
        <div className="mx-auto max-w-6xl px-4 py-5 grid grid-cols-3 divide-x divide-white/5">
          {[
            { value: "Save up to", stat: "70%", sub: "vs retail subscription price" },
            { value: "Platform fee", stat: "6%",  sub: "only charged when funds move" },
            { value: "Secured by",  stat: "Solana", sub: "non-custodial escrow contract" },
          ].map((s) => (
            <div key={s.stat} className="text-center px-4 py-1">
              <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>{s.value}</p>
              <p className="text-2xl font-black gradient-text leading-none">{s.stat}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-20 space-y-24">

        {/* ── How it works ──────────────────────────────────────── */}
        <section className="space-y-10">
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#7c3aed" }}>How it works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Three steps to split smarter</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.num} className="card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                    {step.icon}
                  </div>
                  <span className="text-3xl font-black" style={{ color: "rgba(255,255,255,0.08)" }}>{step.num}</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-[16px]">{step.title}</h3>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--text-2)" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ────────────────────────────────────────── */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#7c3aed" }}>Categories</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Pool everything</h2>
            </div>
            <Link href="/pools" className="text-sm font-medium hidden sm:flex items-center gap-1"
              style={{ color: "#a78bfa" }}>
              View all pools
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <Link key={cat.id} href={`/pools?category=${cat.id}`}
                className="card group flex items-center gap-3 p-4" style={{ textDecoration: "none" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {cat.icon}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm group-hover:text-violet-300 transition-colors">{cat.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>Browse pools →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Trust / why on-chain ──────────────────────────────── */}
        <section className="rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(56,189,248,0.04) 100%)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <div className="p-8 sm:p-12 space-y-10">
            <div className="text-center space-y-3">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#7c3aed" }}>Why on-chain?</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Money held by math, not men</h2>
              <p className="max-w-lg mx-auto text-base" style={{ color: "var(--text-2)" }}>
                Unlike competitors who hold funds in their bank accounts, Poolly escrow lives in a public Solana smart contract. No middleman. No trust required.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {TRUST_POINTS.map((t) => (
                <div key={t.title} className="card p-5 space-y-3">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <h3 className="font-bold text-white">{t.title}</h3>
                    <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-2)" }}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="text-center space-y-6 py-8">
          <h2 className="text-4xl sm:text-5xl font-black">
            <span className="gradient-text">Start saving today.</span>
          </h2>
          <p className="max-w-md mx-auto" style={{ color: "var(--text-2)" }}>
            Join a pool in minutes. No KYC, no bank account, no trust required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/pools" className="btn-primary flex items-center gap-2 px-8 py-3.5 text-[15px]">
              Browse Active Pools
            </Link>
            <Link href="/pools/create" className="btn-ghost flex items-center gap-2 px-8 py-3.5 text-[15px]">
              Host a Pool
            </Link>
          </div>
        </section>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)" }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="2" fill="white"/>
                <circle cx="5" cy="1.5" r="1" fill="rgba(255,255,255,0.6)"/>
                <circle cx="8.5" cy="7.5" r="1" fill="rgba(255,255,255,0.6)"/>
                <circle cx="1.5" cy="7.5" r="1" fill="rgba(255,255,255,0.6)"/>
              </svg>
            </div>
            <span className="font-bold text-sm text-white">Poolly</span>
          </div>
          <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
            © 2025 Poolly · Built on Solana · Devnet Preview
          </p>
          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-3)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-ring"/>
            Program live on devnet
          </div>
        </div>
      </footer>
    </div>
  );
}
