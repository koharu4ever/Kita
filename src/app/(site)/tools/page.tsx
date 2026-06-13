import { ToolsPage as ToolsFeaturePage } from "@/features/tools/components/tools-page";
import { getTools } from "@/server/tools/get-tools";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const tools = await getTools();

  return <ToolsFeaturePage items={tools} />;
}
