import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poolly — Buy together. Pay smarter.",
  description: "Solana-native group buying for subscriptions and services.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-slate-950 text-slate-100 antialiased`}>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
