import type {
  DefaultNodeTypes,
  DefaultTypedEditorState,
} from "@payloadcms/richtext-lexical";
import { buildEditorState } from "@payloadcms/richtext-lexical";

export type ReviewPreview = {
  slug: string;
  title: string;
  gameTitle: string;
  date: string;
  excerpt: string;
  coverImage: string;
  rating: number;
  readingTime: string;
  tags: string[];
  body: DefaultTypedEditorState;
};

function createReviewBody(paragraphs: string[]): DefaultTypedEditorState {
  const [firstParagraph, ...remainingParagraphs] = paragraphs;
  const remainingNodes = remainingParagraphs.flatMap(
    (paragraph) =>
      buildEditorState<DefaultNodeTypes>({ text: paragraph }).root.children,
  );

  return buildEditorState<DefaultNodeTypes>({
    nodes: remainingNodes,
    text: firstParagraph,
  });
}

export const reviewItems: ReviewPreview[] = [
  {
    slug: "quiet-after-rain",
    title: "雨后仍然停在屏幕上的故事",
    gameTitle: "Rain Harbor",
    date: "2026-06-09",
    excerpt:
      "一篇关于氛围、记忆和结尾余韵的短评，记录画面暗下之后仍然留在脑海里的部分。",
    coverImage: "/home-rain-harbor.jpg",
    rating: 8.5,
    readingTime: "6 min read",
    tags: ["Atmosphere", "Memory", "VN"],
    body: createReviewBody([
      "雨停之后，画面里的灯光反而更容易被记住。故事没有急着解释人物的选择，而是让港口、窗户和很慢的对白承担情绪。",
      "我更喜欢把评测页面做得像一页安静的读书笔记：先给图像和标题留空间，再让正文慢慢进入。这里没有复杂交互，只保留阅读感。",
      "结尾没有把所有关系说透，却让前面的停顿获得了新的含义。这种余韵比单纯的反转更值得反复回想。",
    ]),
  },
  {
    slug: "summer-light",
    title: "夏日海边的光为什么会留下来",
    gameTitle: "Sea Side Fragment",
    date: "2026-06-08",
    excerpt: "关于夏日海边、短暂相遇和离开之后仍然留在记忆里的光。",
    coverImage: "/home-sea-girl.jpg",
    rating: 8,
    readingTime: "4 min read",
    tags: ["Summer", "Slice of Life"],
    body: createReviewBody([
      "海边、夏天和回忆是很容易被写得过满的题材，所以这个故事反而把大部分情绪留在光线和停顿里。",
      "真正让场景留下来的不是海面本身，而是人物知道这段时间不会持续太久。",
    ]),
  },
  {
    slug: "night-sky-note",
    title: "夜空、城市灯和很慢的对白",
    gameTitle: "Night Archive",
    date: "2026-06-07",
    excerpt: "一篇关于城市夜景、留白和慢对白如何共同维持戏剧张力的短评。",
    coverImage: "/home-night-sky.jpg",
    rating: 7.5,
    readingTime: "5 min read",
    tags: ["Drama", "Essay"],
    body: createReviewBody([
      "夜空题材适合慢一点的排版。这里的正文宽度、行高和背景遮罩都偏克制，主要服务阅读，而不是做资讯站。",
      "当对白愿意停下来，城市灯光便不再只是背景，而会成为人物之间没有说出口的另一层语言。",
    ]),
  },
];

export function getReviewBySlug(slug: string) {
  return reviewItems.find((review) => review.slug === slug);
}
