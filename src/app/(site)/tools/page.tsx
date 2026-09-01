import type { Metadata } from "next";

import { ToolsPage as ToolsFeaturePage } from "@/features/tools/components/tools-page";
import { getTools } from "@/server/tools/get-tools";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tools | Kita",
  description: "A curated set of game and visual novel tools and references.",
};

export default async function ToolsPage() {
  const tools = await getTools();

  return <ToolsFeaturePage items={tools} />;
}
