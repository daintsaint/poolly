import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="py-16 text-center space-y-6">
        <div className="inline-block rounded-full bg-indigo-900/40 border border-indigo-700/50 px-4 py-1 text-sm text-indigo-300 mb-2">
          Built on Solana · Trustless escrow
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Buy together.{" "}
          <span className="text-indigo-400">Pay smarter.</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-slate-400">
          Pool with friends or strangers to split subscriptions, services, and
          more — with on-chain escrow so your money stays safe.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/pools"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Browse Pools
          </Link>
          <Link
            href="/pools/create"
            className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
          >
            Create a Pool
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
        {[
          { label: "Save up to", value: "70%", sub: "vs retail price" },
          { label: "Platform fee", value: "6%", sub: "only when funds move" },
          { label: "Secured by", value: "Solana", sub: "on-chain escrow" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold text-indigo-400">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            <p className="text-xs text-slate-600">{s.sub}</p>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Everything under the sun</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/pools?category=${cat.id}`}
              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-indigo-600 transition-colors"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="font-medium text-slate-200">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Join or create a pool",
              desc: "Find a pool for what you need, or create one and invite others.",
            },
            {
              step: "2",
              title: "Funds held in escrow",
              desc: "Your payment locks into a Solana escrow smart contract — released only when the host delivers.",
            },
            {
              step: "3",
              title: "Host delivers, funds release",
              desc: "Host uploads proof of service, escrow releases. Rate the host to build reputation.",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {s.step}
              </span>
              <h3 className="font-semibold text-white">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
