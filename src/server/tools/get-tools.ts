import { env } from "@/config/env";
import { toolkitItems } from "@/features/tools/data/toolkit-items";
import { mapToolDocumentToToolkitItem } from "@/features/tools/utils/map-tool-document-to-toolkit-item";
import { getPayloadClient } from "@/server/payload/get-payload";

export async function getTools() {
  try {
    const payload = await getPayloadClient();
    const tools = await payload.find({
      collection: "tools",
      limit: 20,
      overrideAccess: false,
      sort: "sortOrder",
    });

    if (tools.docs.length === 0) {
      return env.NODE_ENV === "production" ? [] : toolkitItems;
    }

    return tools.docs.map((tool) => mapToolDocumentToToolkitItem(tool));
  } catch (error) {
    if (env.NODE_ENV === "production") {
      console.error("Failed to load tools from Payload.", error);
      throw error;
    }

    console.warn(
      "Failed to load tools from Payload. Using local fallback.",
      error,
    );

    return toolkitItems;
  }
}
