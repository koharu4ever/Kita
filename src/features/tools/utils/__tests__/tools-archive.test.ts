import { describe, expect, it } from "vitest";
import { toolPreviewFixtures } from "@/features/tools/preview/tool-preview-fixtures";
import {
  archiveFacets,
  archiveTone,
  archiveViews,
  normalizeArchiveText,
  selectArchiveItems,
} from "@/features/tools/utils/tools-archive";

const items = toolPreviewFixtures;
describe("Tools archive (ported Notes controls)", () => {
  it("retains all five original views", () => {
    expect(archiveViews).toEqual([
      "minimal",
      "minimal-plus",
      "compact",
      "extended",
      "thumbnail",
    ]);
  });
  it("normalizes Unicode width, case and surrounding whitespace", () => {
    expect(normalizeArchiveText("  ＶＮＤＢ  ")).toBe("vndb");
    expect(
      selectArchiveItems(items, " ＶＮＤＢ ", [], "recommended", "25", 1)
        .items[0].title,
    ).toBe("VNDB");
  });
  it("searches descriptions and source URLs as well as titles", () => {
    expect(
      selectArchiveItems(items, "flashcard", [], "recommended", "25", 1)
        .items[0].title,
    ).toBe("Anki");
    expect(
      selectArchiveItems(
        items,
        "github.com/artikash",
        [],
        "recommended",
        "25",
        1,
      ).items[0].title,
    ).toBe("Textractor");
  });
  it("combines selected filters with AND, as in the original archive", () => {
    const result = selectArchiveItems(
      items,
      "",
      [
        { kind: "category", value: "database" },
        { kind: "source", value: "VNDB.ORG" },
      ],
      "recommended",
      "25",
      1,
    );
    expect(result.items.map((item) => item.title)).toEqual(["VNDB"]);
    expect(
      selectArchiveItems(
        items,
        "",
        [
          { kind: "category", value: "Database" },
          { kind: "category", value: "Runtime" },
        ],
        "recommended",
        "25",
        1,
      ).total,
    ).toBe(0);
  });
  it("keeps CMS curated ordering by default and supports timestamp/title sorting", () => {
    expect(
      selectArchiveItems(items, "", [], "recommended", "all", 1).items,
    ).toEqual(items);
    expect(
      selectArchiveItems(items, "", [], "oldest", "25", 1).items[0].title,
    ).toBe("LanguageTool");
    expect(
      selectArchiveItems(items, "", [], "newest", "25", 1).items[0].title,
    ).toBe("VNDB");
    expect(
      selectArchiveItems(items, "", [], "title", "25", 1).items[0].title,
    ).toBe("Anki");
  });
  it("uses stable source ordering for equal or absent timestamps", () => {
    const same = items.slice(0, 3).map((item) => ({ ...item, createdAt: "" }));
    expect(selectArchiveItems(same, "", [], "newest", "25", 1).items).toEqual(
      same,
    );
  });
  it("paginates all matches, including resources after the old 20-item limit", () => {
    expect(
      selectArchiveItems(items, "", [], "recommended", "25", 1).items,
    ).toHaveLength(25);
    const last = selectArchiveItems(items, "", [], "recommended", "25", 99);
    expect(last).toMatchObject({ page: 2, totalPages: 2, total: 30 });
    expect(last.items).toHaveLength(5);
  });
  it("supports 50/all and clamps an out-of-range page after filtering", () => {
    for (const size of ["50", "all"] as const)
      expect(
        selectArchiveItems(items, "", [], "recommended", size, 2).items,
      ).toHaveLength(30);
    expect(
      selectArchiveItems(items, "VNDB", [], "recommended", "25", 2).page,
    ).toBe(1);
    expect(selectArchiveItems([], "", [], "recommended", "all", 9)).toEqual({
      items: [],
      page: 1,
      total: 0,
      totalPages: 1,
    });
    expect(
      selectArchiveItems(items, "", [], "recommended", "25", NaN).page,
    ).toBe(1);
  });
  it("counts actual categories and uses deterministic original tone hashing", () => {
    expect(
      archiveFacets(items, "category").find(
        (facet) => facet.value === "Database",
      )?.count,
    ).toBe(8);
    expect(archiveTone("Database")).toBe(archiveTone("Database"));
    expect(archiveTone("Database")).toBeLessThan(10);
  });
});
