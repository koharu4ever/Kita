import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  image?: string,
  type: "website" | "article" = "website",
): Metadata {
  const url = new URL(path, siteConfig.url).href;
  const images = image ? [new URL(image, siteConfig.url).href] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}
