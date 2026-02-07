import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TikClipper - AI Video Clipper for Shopee Affiliate",
  description: "Automatically clip product review videos and generate TikTok-ready content with Shopee affiliate links",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <a href="/" className="text-xl font-bold">TikClipper</a>
              <nav className="flex gap-4">
                <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</a>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
