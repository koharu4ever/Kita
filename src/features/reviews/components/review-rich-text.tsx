import {
  type JSXConvertersFunction,
  RichText,
} from "@payloadcms/richtext-lexical/react";
import { createElement } from "react";

import type { ReviewPreview } from "@/features/reviews/types/review-preview";
import { createReviewOutline } from "@/features/reviews/utils/review-outline";

import styles from "./review-rich-text.module.css";

export function ReviewRichText({ body }: Pick<ReviewPreview, "body">) {
  const { headingIds } = createReviewOutline(body);
  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
      const tag = node.tag as "h2" | "h3" | "h4";
      return createElement(
        tag,
        { id: headingIds.get(node) },
        nodesToJSX({ nodes: node.children }),
      );
    },
  });

  return (
    <RichText className={styles.root} converters={converters} data={body} />
  );
}
