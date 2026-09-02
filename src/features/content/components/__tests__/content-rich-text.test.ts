import {
  buildEditorState,
  type DefaultTypedEditorState,
} from "@payloadcms/richtext-lexical";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ContentRichText } from "../content-rich-text";

function bodyWith(...nodes: unknown[]): DefaultTypedEditorState {
  const body = buildEditorState({
    text: "Existing paragraph",
  }) as DefaultTypedEditorState;
  body.root.children.push(...(nodes as typeof body.root.children));
  return body;
}

const text = {
  type: "text",
  version: 1,
  text: "Readable link",
  format: 0,
  detail: 0,
  mode: "normal",
  style: "",
};

describe("public rich text rendering", () => {
  it("preserves existing text and renders Media caption and alt as escaped text", () => {
    const body = bodyWith({
      type: "upload",
      version: 3,
      relationTo: "media",
      value: {
        mimeType: "image/png",
        url: "/test.png",
        alt: "<script>not markup</script>",
        width: 64,
        height: 40,
      },
      fields: { caption: "<strong>caption</strong>" },
    });
    const html = renderToStaticMarkup(createElement(ContentRichText, { body }));
    expect(html).toContain("Existing paragraph");
    expect(html).toContain("<figure>");
    expect(html).toContain("&lt;script&gt;not markup&lt;/script&gt;");
    expect(html).toContain(
      "<figcaption>&lt;strong&gt;caption&lt;/strong&gt;</figcaption>",
    );
    expect(html).not.toContain("<script>");
  });

  it("renders missing images without crashing an article", () => {
    const html = renderToStaticMarkup(
      createElement(ContentRichText, {
        body: bodyWith({
          type: "upload",
          version: 3,
          relationTo: "media",
          value: null,
        }),
      }),
    );
    expect(html).toContain("Image unavailable.");
    expect(html).toContain("Existing paragraph");
  });

  it("renders internal links and strips unsafe custom links", () => {
    const body = bodyWith(
      {
        type: "link",
        version: 3,
        children: [text],
        fields: {
          linkType: "internal",
          newTab: true,
          doc: {
            relationTo: "games",
            value: { slug: "game", publicationStatus: "published" },
          },
        },
      },
      {
        type: "link",
        version: 3,
        children: [text],
        fields: { linkType: "custom", url: "javascript:alert(1)" },
      },
    );
    const html = renderToStaticMarkup(createElement(ContentRichText, { body }));
    expect(html).toContain('href="/games/game"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("<span>Readable link</span>");
    expect(html).not.toContain("javascript:");
  });

  it("preserves heading IDs, alignment, inline code and separators", () => {
    const heading = {
      type: "heading",
      tag: "h2",
      version: 1,
      format: "center",
      indent: 0,
      direction: null,
      children: [text],
    };
    const body = bodyWith(
      heading,
      { type: "paragraph", version: 1, children: [{ ...text, format: 16 }] },
      { type: "horizontalrule", version: 1 },
    );
    const html = renderToStaticMarkup(
      createElement(ContentRichText, {
        body,
        headingIds: new Map([[heading, "example-heading"]]),
      }),
    );
    expect(html).toContain('id="example-heading"');
    expect(html).toContain("text-align:center");
    expect(html).toContain("<code>Readable link</code>");
    expect(html).toContain("<hr");
  });
});
