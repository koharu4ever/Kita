import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
