import { describe, expect, it } from "vitest";

import {
  contentImage,
  contentLinkHref,
  safeContentHref,
} from "../rich-text-nodes";

describe("rich text links", () => {
  it.each([
    "https://example.com/article",
    "http://example.com",
    "/games/example",
    "#section",
    "mailto:hello@example.com",
  ])("keeps safe link %s", (href) => {
    expect(safeContentHref(href)).toBe(href);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,bad",
    "//example.com",
    "/\\example.com",
    " javaScript:alert(1)",
    "java\nscript:alert(1)",
    "relative",
    "",
  ])("rejects unsafe or invalid link %s", (href) => {
    expect(safeContentHref(href)).toBeUndefined();
  });

  it("resolves published internal articles without linking to drafts or reserved routes", () => {
    const fields = {
      linkType: "internal",
      doc: {
        relationTo: "reviews",
        value: { slug: "good-review", status: "published" },
      },
    };
    expect(contentLinkHref(fields)).toBe("/reviews/good-review");
    expect(
      contentLinkHref({
        ...fields,
        doc: { ...fields.doc, value: { slug: "draft", status: "draft" } },
      }),
    ).toBeUndefined();
    expect(
      contentLinkHref({ ...fields, doc: { ...fields.doc, value: 7 } }),
    ).toBeUndefined();
    expect(
      contentLinkHref({
        ...fields,
        doc: { ...fields.doc, value: { slug: "random", status: "published" } },
      }),
    ).toBeUndefined();
    expect(
      contentLinkHref({
        linkType: "internal",
        doc: {
          relationTo: "games",
          value: { slug: "game", publicationStatus: "published" },
        },
      }),
    ).toBe("/games/game");
    expect(
      contentLinkHref({ linkType: "custom", url: "https://example.com" }),
    ).toBe("https://example.com");
  });
});

describe("rich text Media images", () => {
  const media = {
    alt: "A rainy window",
    mimeType: "image/png",
    url: "/api/media/file/window.png",
    width: 2400,
    height: 1600,
    sizes: {
      display: {
        url: "/api/media/file/window-display.webp",
        width: 1600,
        height: 1067,
      },
    },
  };

  it("prefers the display size, keeps alt text and per-use captions", () => {
    expect(
      contentImage({
        relationTo: "media",
        value: media,
        fields: { caption: "Evening rain" },
      }),
    ).toEqual({
      src: "/api/media/file/window-display.webp",
      width: 1600,
      height: 1067,
      alt: "A rainy window",
      caption: "Evening rain",
    });
  });

  it("falls back to the original when no usable display image exists", () => {
    expect(
      contentImage({ relationTo: "media", value: { ...media, sizes: {} } })
        ?.src,
    ).toBe(media.url);
  });

  it.each([
    null,
    3,
    { relationTo: "media", value: null },
    { relationTo: "media", value: 3 },
    { relationTo: "users", value: media },
    { relationTo: "media", value: { ...media, mimeType: "application/pdf" } },
  ])("handles missing, unresolved and unsupported uploads safely", (node) => {
    expect(contentImage(node)).toBeUndefined();
  });
});
