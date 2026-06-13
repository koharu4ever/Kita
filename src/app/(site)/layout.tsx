import type { Metadata } from "next";
import { Bebas_Neue, VT323 } from "next/font/google";
import type { ReactNode } from "react";

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
  title: "Kita",
  description: "Personal website engineering base.",
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="zh-CN">
      <body className={`${bebasNeue.variable} ${vt323.variable}`}>
        {children}
      </body>
    </html>
  );
}
