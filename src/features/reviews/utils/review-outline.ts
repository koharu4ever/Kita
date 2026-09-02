import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical";

export type ReviewOutlineItem = {
  id: string;
  level: 2 | 3 | 4;
  text: string;
};

type LexicalNode = {
  children?: LexicalNode[];
  tag?: string;
  text?: string;
  type?: string;
};

function textContent(node: LexicalNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.children ?? []).map(textContent).join("");
}

function slugifyHeading(value: string) {
  return (
    value
      .normalize("NFKC")
      .toLocaleLowerCase()
      .trim()
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

export function createReviewOutline(body: DefaultTypedEditorState) {
  const items: ReviewOutlineItem[] = [];
  const headingIds = new Map<object, string>();
  const seen = new Map<string, number>();
  const root = body.root as unknown as LexicalNode;

  for (const node of root.children ?? []) {
    if (
      node.type !== "heading" ||
      (node.tag !== "h2" && node.tag !== "h3" && node.tag !== "h4")
    ) {
      continue;
    }

    const text = textContent(node).trim();
    if (!text) continue;

    const baseId = slugifyHeading(text);
    const occurrence = (seen.get(baseId) ?? 0) + 1;
    const id = occurrence === 1 ? baseId : `${baseId}-${occurrence}`;
    seen.set(baseId, occurrence);
    headingIds.set(node, id);
    items.push({ id, level: Number(node.tag[1]) as 2 | 3 | 4, text });
  }

  return { headingIds, items };
}
