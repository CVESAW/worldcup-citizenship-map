import type { Metadata } from "next";
// Self-hosted Geist fonts (Vercel's `geist` package) — no build-time network
// fetch to Google Fonts. Exposes the same --font-geist-sans/-mono variables.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "World Cup Citizenship Map",
  description:
    "Explore the global connections between World Cup footballers and the countries they hold citizenship of. Click a country or search a club.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
