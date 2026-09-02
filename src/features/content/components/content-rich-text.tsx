import type {
  DefaultTypedEditorState,
  SerializedLinkNode,
  SerializedAutoLinkNode,
} from "@payloadcms/richtext-lexical";
import {
  type JSXConvertersFunction,
  type JSXConverterArgs,
  RichText,
} from "@payloadcms/richtext-lexical/react";
import Image from "next/image";
import { createElement } from "react";

import { contentImage, contentLinkHref } from "../utils/rich-text-nodes";

type ContentRichTextProps = {
  body: DefaultTypedEditorState;
  className?: string;
  headingIds?: Map<object, string>;
};

export function ContentRichText({
  body,
  className,
  headingIds,
}: ContentRichTextProps) {
  const converters: JSXConvertersFunction = ({ defaultConverters }) => {
    const link = ({
      node,
      nodesToJSX,
    }: JSXConverterArgs<SerializedLinkNode | SerializedAutoLinkNode>) => {
      const children = nodesToJSX({ nodes: node.children });
      const href = contentLinkHref(node.fields);
      if (!href) return <span>{children}</span>;
      return (
        <a
          href={href}
          target={node.fields.newTab ? "_blank" : undefined}
          rel={node.fields.newTab ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    };

    return {
      ...defaultConverters,
      link,
      autolink: link,
      heading: ({ node, nodesToJSX }) =>
        createElement(
          ["h2", "h3", "h4"].includes(node.tag) ? node.tag : "h2",
          { id: headingIds?.get(node) },
          nodesToJSX({ nodes: node.children }),
        ),
      upload: ({ node }) => {
        const image = contentImage(node);
        if (!image) return <p role="note">Image unavailable.</p>;
        return (
          <figure>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 768px) 100vw, 800px"
            />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        );
      },
    };
  };

  return <RichText className={className} converters={converters} data={body} />;
}
