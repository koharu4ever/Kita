import type { Tool } from "@/payload/payload-types";
import type { ToolkitItem } from "@/features/tools/types/toolkit-item";

export type PayloadToolDocument = Pick<
  Tool,
  "category" | "createdAt" | "description" | "id" | "title" | "url"
>;

const categoryLabels: Record<string, string> = {
  "text-hooking": "Text Hooking",
  runtime: "Runtime",
  database: "Database",
  capture: "Capture",
};

function formatAddedOn(value?: string | null) {
  if (!value || !Number.isFinite(Date.parse(value))) {
    return "Payload CMS";
  }

  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function mapToolDocumentToToolkitItem(
  tool: PayloadToolDocument,
): ToolkitItem {
  const category = tool.category
    ? (categoryLabels[tool.category] ?? tool.category)
    : "Tool";

  return {
    id: String(tool.id),
    title: tool.title,
    addedOn: formatAddedOn(tool.createdAt),
    createdAt: tool.createdAt,
    category,
    source: getToolSource(tool.url),
    // Decorative category artwork, not a screenshot of the linked resource.
    cover: `/tools/archive/${tool.category && Object.hasOwn(categoryLabels, tool.category) ? tool.category : "text-hooking"}.webp`,
    summary: tool.description,
    links: [
      {
        href: tool.url,
        label: "Open resource",
        note: category,
      },
    ],
  };
}

function getToolSource(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "External resource";
  }
}
