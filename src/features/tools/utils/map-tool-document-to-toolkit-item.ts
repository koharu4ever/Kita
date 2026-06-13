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

function formatPostedOn(value?: string | null) {
  if (!value) {
    return "Payload CMS";
  }

  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
    postedOn: formatPostedOn(tool.createdAt),
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
