import { describe, expect, it } from "vitest";

import { createPayloadToolDocument } from "@/testing/fixtures/payload-documents";
import { mapToolDocumentToToolkitItem } from "@/features/tools/utils/map-tool-document-to-toolkit-item";

describe("mapToolDocumentToToolkitItem", () => {
  it("maps a Payload tool into the toolkit view model", () => {
    const result = mapToolDocumentToToolkitItem(
      createPayloadToolDocument({
        category: "database",
        id: 42,
        title: "VNDB",
        url: "https://vndb.org/",
      }),
    );

    expect(result).toMatchObject({
      id: "42",
      category: "Database",
      source: "vndb.org",
      cover: "/tools/archive/database.webp",
      links: [
        {
          href: "https://vndb.org/",
          label: "Open resource",
          note: "Database",
        },
      ],
      title: "VNDB",
    });
    expect(result.addedOn).toContain("2026");
  });

  it("uses safe labels when optional metadata is empty", () => {
    const result = mapToolDocumentToToolkitItem(
      createPayloadToolDocument({
        category: undefined,
        createdAt: "",
      }),
    );

    expect(result.links[0]?.note).toBe("Tool");
    expect(result.addedOn).toBe("Payload CMS");
    expect(result.cover).toBe("/tools/archive/text-hooking.webp");
  });

  it("keeps malformed legacy metadata from crashing the list", () => {
    const result = mapToolDocumentToToolkitItem(
      createPayloadToolDocument({ createdAt: "invalid", url: "invalid" }),
    );
    expect(result.addedOn).toBe("Payload CMS");
    expect(result.source).toBe("External resource");
  });
});
