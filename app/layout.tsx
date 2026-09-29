import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Newsreader, Outfit } from "next/font/google";
import { auth } from "@/auth";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Wisckotonia",
    template: "%s · Wisckotonia",
  },
  description: "Besloten platform van dispuut Wisckotonia.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  const showDevTools = process.env.NODE_ENV === "development" && session?.user.role === "ADMIN"

  return (
    <html
      lang="nl"
      className={`${outfit.variable} ${newsreader.variable} h-full antialiased`}
      data-dev-tools={showDevTools ? "true" : undefined}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
