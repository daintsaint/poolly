import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Chatbot } from "@/components/chatbot";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Poolly — Split subscriptions. On-chain.",
  description: "The trustless way to share subscription costs with anyone. Powered by Solana.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased`} style={{ background: "var(--bg-base)", color: "var(--text-1)" }}>
        <Providers>
          <Navbar />
          {children}
          <Chatbot />
        </Providers>
      </body>
    </html>
  );
}
