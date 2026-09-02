import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/config/env";
import { ToolsPage } from "@/features/tools/components/tools-page";
import { toolPreviewFixtures } from "@/features/tools/preview/tool-preview-fixtures";

export const metadata: Metadata = {
  title: "Tools UI Preview | Kita",
  robots: { follow: false, index: false },
};

export default function ToolsPreviewPage() {
  if (env.NODE_ENV !== "development") notFound();
  return <ToolsPage items={toolPreviewFixtures} preview />;
}
