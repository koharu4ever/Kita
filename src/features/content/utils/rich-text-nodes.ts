type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

export function safeContentHref(value: unknown): string | undefined {
  if (typeof value !== "string" || !value || value !== value.trim()) return;
  if (
    value.includes("\\") ||
    [...value].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    return;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (value.startsWith("#")) return value;
  try {
    const url = new URL(value);
    if (["https:", "http:", "mailto:"].includes(url.protocol)) return value;
  } catch {
    // An invalid stored link should remain readable text, not break the article.
  }
}

export function contentLinkHref(fields: unknown): string | undefined {
  const link = record(fields);
  if (!link) return;
  if (link.linkType !== "internal") return safeContentHref(link.url);

  const doc = record(link.doc);
  const value = record(doc?.value);
  if (!value) return;

  if (doc?.relationTo === "games" || doc?.relationTo === "reviews") {
    const status =
      doc.relationTo === "games" ? value.publicationStatus : value.status;
    if (status !== "published" || typeof value.slug !== "string") return;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) return;
    if (
      value.slug === "preview" ||
      (doc.relationTo === "reviews" && value.slug === "random")
    )
      return;
    return `/${doc.relationTo}/${value.slug}`;
  }
}

export function contentImage(node: unknown) {
  const upload = record(node);
  if (upload?.relationTo !== "media") return;
  const media = record(upload.value);
  if (
    !media ||
    typeof media.mimeType !== "string" ||
    !media.mimeType.startsWith("image/")
  )
    return;
  const display = record(record(media.sizes)?.display);
  const candidates = [display, media];
  for (const candidate of candidates) {
    const src = safeContentHref(candidate?.url);
    const width = candidate?.width;
    const height = candidate?.height;
    if (!src || src.startsWith("mailto:") || src.startsWith("#")) continue;
    if (
      typeof width !== "number" ||
      typeof height !== "number" ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      continue;
    const fields = record(upload.fields);
    return {
      src,
      width,
      height,
      alt: typeof media.alt === "string" ? media.alt : "",
      caption: typeof fields?.caption === "string" ? fields.caption : undefined,
    };
  }
}
