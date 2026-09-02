import { mapToolDocumentToToolkitItem } from "@/features/tools/utils/map-tool-document-to-toolkit-item";
import { getPayloadClient } from "@/server/payload/get-payload";

export async function getTools() {
  try {
    const payload = await getPayloadClient();
    const tools = await payload.find({
      collection: "tools",
      pagination: false,
      overrideAccess: false,
      sort: "sortOrder",
    });

    return tools.docs.map((tool) => mapToolDocumentToToolkitItem(tool));
  } catch (error) {
    console.error("Failed to load tools from Payload.", error);
    throw error;
  }
}
