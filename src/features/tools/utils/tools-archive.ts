import type { ToolkitItem } from "@/features/tools/types/toolkit-item";

export const archiveViews = [
  "minimal",
  "minimal-plus",
  "compact",
  "extended",
  "thumbnail",
] as const;
export const archiveSorts = [
  "recommended",
  "newest",
  "oldest",
  "title",
] as const;
export const archivePageSizes = ["25", "50", "all"] as const;
export type ArchiveView = (typeof archiveViews)[number];
export type ArchiveSort = (typeof archiveSorts)[number];
export type ArchivePageSize = (typeof archivePageSizes)[number];
export type ArchiveFilter = { kind: "category" | "source"; value: string };

// Match the original Notes controls: Unicode-normalized substring search,
// AND filters, stable sort ties, and clamped client-side pagination.
export function normalizeArchiveText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("zh-CN").trim();
}

export function archiveTone(value: string) {
  let hash = 0;
  for (const character of value)
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  return hash % 10;
}

export function archiveFacets(
  items: ToolkitItem[],
  kind: ArchiveFilter["kind"],
) {
  const counts = new Map<string, number>();
  for (const item of items)
    counts.set(item[kind], (counts.get(item[kind]) ?? 0) + 1);
  return [...counts]
    .map(([value, count]) => ({ kind, value, count }))
    .sort(
      (a, b) => b.count - a.count || a.value.localeCompare(b.value, "zh-CN"),
    );
}

export function selectArchiveItems(
  items: ToolkitItem[],
  query: string,
  filters: ArchiveFilter[],
  sort: ArchiveSort,
  pageSize: ArchivePageSize,
  requestedPage: number,
) {
  const normalized = normalizeArchiveText(query);
  const matches = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const searchText = normalizeArchiveText(
        [
          item.title,
          item.summary,
          item.category,
          item.source,
          ...item.links.map((link) => link.href),
        ].join(" "),
      );
      return (
        (!normalized || searchText.includes(normalized)) &&
        filters.every(
          (filter) =>
            normalizeArchiveText(item[filter.kind]) ===
            normalizeArchiveText(filter.value),
        )
      );
    })
    .sort((left, right) => {
      let difference = 0;
      const leftTime = Date.parse(left.item.createdAt) || 0;
      const rightTime = Date.parse(right.item.createdAt) || 0;
      if (sort === "newest") difference = rightTime - leftTime;
      if (sort === "oldest") difference = leftTime - rightTime;
      if (sort === "title")
        difference = normalizeArchiveText(left.item.title).localeCompare(
          normalizeArchiveText(right.item.title),
          "zh-CN",
          { numeric: true, sensitivity: "base" },
        );
      return difference || left.index - right.index;
    });
  const size =
    pageSize === "all" ? Math.max(1, matches.length) : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(matches.length / size));
  const page = Math.max(
    1,
    Math.min(
      Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1,
      totalPages,
    ),
  );
  return {
    items: matches
      .slice((page - 1) * size, page * size)
      .map(({ item }) => item),
    total: matches.length,
    totalPages,
    page,
  };
}
