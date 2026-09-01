import type { Metadata } from "next";
import { Bebas_Neue, VT323 } from "next/font/google";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";

import "../globals.css";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
});

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    description: siteConfig.description,
    siteName: siteConfig.name,
    title: siteConfig.title,
    type: "website",
    url: "/",
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className={`${bebasNeue.variable} ${vt323.variable}`}>
        {children}
      </body>
    </html>
  );
}
