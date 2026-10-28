import type { MetadataRoute } from "next";

import { getSitemapDetails } from "@/server/seo/get-sitemap-details";

import { siteConfig } from "@/config/site";

// Read current publication state on every request, including unpublishes and deletions.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const details = await getSitemapDetails();

  return [
    ...details,
    { changeFrequency: "weekly", priority: 1, url: siteConfig.url },
    {
      changeFrequency: "weekly",
      priority: 0.9,
      url: `${siteConfig.url}/games`,
    },
    {
      changeFrequency: "weekly",
      priority: 0.9,
      url: `${siteConfig.url}/reviews`,
    },
    {
      changeFrequency: "monthly",
      priority: 0.7,
      url: `${siteConfig.url}/about`,
    },
    {
      changeFrequency: "monthly",
      priority: 0.5,
      url: `${siteConfig.url}/tools`,
    },
  ];
}
