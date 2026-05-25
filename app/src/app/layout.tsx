import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Chatbot } from "@/components/chatbot";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["200", "300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Poolly — Smarter pooling.",
  description: "Smarter pooling. Full price is overrated. Split subscriptions on Solana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}
        style={{ background: "#0C0B09", color: "#EDE6D6", fontFamily: "var(--font-geist), sans-serif" }}
      >
        <Providers>
          {children}
          <Chatbot />
        </Providers>
      </body>
    </html>
  );
}
