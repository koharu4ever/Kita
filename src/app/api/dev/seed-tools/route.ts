import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { getPayloadClient } from "@/server/payload/get-payload";

const seedTools = [
  {
    category: "text-hooking",
    description:
      "A practical entry point for extracting visual novel text before sending it to dictionaries, translators, or notes.",
    sortOrder: 10,
    title: "Textractor",
    url: "https://github.com/Artikash/Textractor",
  },
  {
    category: "database",
    description:
      "A visual novel database for checking releases, creators, tags, editions, and related works.",
    sortOrder: 20,
    title: "VNDB",
    url: "https://vndb.org/",
  },
] as const;

export async function POST() {
  if (env.NODE_ENV === "production" || !env.ENABLE_DEV_SEED) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const payload = await getPayloadClient();
  const createdOrUpdated = [];

  for (const tool of seedTools) {
    const existing = await payload.find({
      collection: "tools",
      limit: 1,
      where: {
        title: {
          equals: tool.title,
        },
      },
    });

    const savedTool = existing.docs[0]
      ? await payload.update({
          id: existing.docs[0].id,
          collection: "tools",
          data: tool,
        })
      : await payload.create({
          collection: "tools",
          data: tool,
        });

    createdOrUpdated.push(savedTool);
  }

  return NextResponse.json({
    count: createdOrUpdated.length,
    tools: createdOrUpdated.map((tool) => ({
      id: tool.id,
      title: tool.title,
    })),
  });
}
