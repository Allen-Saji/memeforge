import type { Metadata } from "next";
import { Orbitron, Exo_2, Geist_Mono } from "next/font/google";
import { Web3Provider } from "@/lib/web3/provider";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const exo2 = Exo_2({
  variable: "--font-exo2",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MemeForge | Narrative Arbitrage Engine",
  description:
    "AI-powered narrative gap detection and token launch package generator for Four.meme on BNB Chain",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${exo2.variable} ${geistMono.variable} h-full dark`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
