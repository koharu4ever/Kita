import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getPayloadClient } from "@/server/payload/get-payload";

export async function getSitemapDetails(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient();
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const collection of ["games", "reviews"] as const) {
    let page = 1;
    while (true) {
      const result = await payload.find({
        collection,
        depth: 0,
        limit: 100,
        page,
        sort: "id",
        overrideAccess: false,
        select: { slug: true, updatedAt: true },
        where:
          collection === "games"
            ? { publicationStatus: { equals: "published" } }
            : { status: { equals: "published" } },
      });

      for (const doc of result.docs) {
        // These routes cannot resolve to a public detail page. No separate
        // noindex field exists in the current collections.
        if (
          !/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(doc.slug) ||
          doc.slug === "preview" ||
          (collection === "reviews" && doc.slug === "random")
        ) {
          continue;
        }
        const url = `${siteConfig.url}/${collection}/${doc.slug}`;
        const modified = new Date(doc.updatedAt);
        entries.set(url, {
          url,
          ...(Number.isNaN(modified.getTime())
            ? {}
            : { lastModified: modified }),
        });
      }

      if (!result.hasNextPage) break;
      if (!result.nextPage || result.nextPage <= page) {
        throw new Error("Invalid sitemap pagination from Payload");
      }
      page = result.nextPage;
    }
  }

  return [...entries.values()];
}
