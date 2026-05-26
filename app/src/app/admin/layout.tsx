"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/pools", label: "Pools" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "var(--font-geist), sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          background: "var(--b-ink-2)",
          borderRight: "1px solid var(--b-rule)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          overflowY: "auto",
          zIndex: 50,
        }}
      >
        {/* Logo area */}
        <div
          style={{
            padding: "28px 24px 24px",
            borderBottom: "1px solid var(--b-rule)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-newsreader), serif",
              fontSize: 22,
              color: "var(--b-paper)",
              letterSpacing: "-0.3px",
              marginBottom: 4,
            }}
          >
            Poolly
          </div>
          <span
            className="b-eyebrow"
            style={{
              color: "var(--b-gold)",
              fontSize: 10,
              letterSpacing: "0.14em",
            }}
          >
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "block",
                  padding: "9px 24px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: active ? "var(--b-gold)" : "var(--b-paper-40, rgba(237,230,214,0.4))",
                  textDecoration: "none",
                  background: active ? "rgba(201,162,79,0.06)" : "transparent",
                  borderLeft: active ? "2px solid var(--b-gold)" : "2px solid transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--b-rule)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--b-paper-40, rgba(237,230,214,0.4))",
              textDecoration: "none",
            }}
          >
            ← Back to app
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              background: "none",
              border: "1px solid var(--b-rule)",
              color: "var(--b-paper-40, rgba(237,230,214,0.4))",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              padding: "6px 10px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          marginLeft: 240,
          minHeight: "100vh",
          background: "var(--b-ink)",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
