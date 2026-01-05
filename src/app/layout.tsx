import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Chatbot } from "@/components/site/chatbot";
import { Toaster } from "@/components/ui/sonner";
// Removed analytics for pure static site
import { siteMetadata } from "@/lib/metadata";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased min-h-screen bg-background text-foreground`}>
        <Header />
        <main className="pt-16">{children}</main>
        <Footer />
        <Chatbot />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
