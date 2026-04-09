import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trendle Creator Program",
  description: "Track creator engagement and impressions for Trendle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <aside className="w-64 bg-card border-r border-border min-h-screen p-6 flex flex-col gap-2">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-primary">Trendle</h1>
            <p className="text-sm text-muted-foreground">Creator Program</p>
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/tweets"
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Trendle Tweets
            </Link>
            <Link
              href="/suggestions"
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Suggestions
            </Link>
            <Link
              href="/market-visuals"
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Market Visuals
            </Link>
            <Link
              href="/calculator"
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              PnL Calculator
            </Link>
            <Link
              href="/team"
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Trendle Team
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
