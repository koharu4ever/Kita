import type { ReviewOutlineItem } from "@/features/reviews/utils/review-outline";

import styles from "./review-detail.module.css";

export function ReviewTableOfContents({
  items,
}: {
  items: ReviewOutlineItem[];
}) {
  if (items.length === 0) return null;

  return (
    <aside className={styles.toc} aria-label="文章目录">
      <p className={styles.tocTitle}>CONTENTS</p>
      <ol>
        {items.map((item) => (
          <li key={item.id} data-level={item.level}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
