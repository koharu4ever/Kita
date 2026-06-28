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
    gameTitle: "Placeholder Visual Novel",
    date: "2026-06-09",
    excerpt:
      "一篇关于氛围、记忆和结尾余韵的短评。这里先保留静态文字，后续可以替换成 Payload CMS 的 review excerpt。",
    coverImage: "/home-rain-harbor.jpg",
    rating: 8.5,
    readingTime: "6 min read",
    tags: ["Atmosphere", "Memory", "VN"],
    body: createReviewBody([
      "这篇演示文本只负责撑起详情页的节奏。真正的数据库内容以后可以映射成同样的字段，前端模板不需要知道它来自哪里。",
      "我更喜欢把评测页面做得像一页安静的读书笔记：先给图像和标题留空间，再让正文慢慢进入。这里没有复杂交互，只保留阅读感。",
      "如果以后要接 Payload，这个页面只需要替换数据源，不需要把 layout、导航或卡片结构重写。",
    ]),
  },
  {
    slug: "summer-light",
    title: "夏日海边的光为什么会留下来",
    gameTitle: "Sea Side Fragment",
    date: "2026-06-08",
    excerpt:
      "这个卡片只负责展示评测摘要，不关心后端来自哪里。真正接 Payload 时，只需要把 CMS 文档转成这个形状。",
    coverImage: "/home-sea-girl.jpg",
    rating: 8,
    readingTime: "4 min read",
    tags: ["Summer", "Slice of Life"],
    body: createReviewBody([
      "海边、夏天和回忆是很容易被写得过满的题材，所以这个模板故意留白。它更像一个入口，而不是完整文章系统。",
      "卡片和详情页共用同一份 mock data，说明这个功能现在仍然是纯前端展示层，不需要数据库参与。",
    ]),
  },
  {
    slug: "night-sky-note",
    title: "夜空、城市灯和很慢的对白",
    gameTitle: "Night Archive",
    date: "2026-06-07",
    excerpt:
      "老项目里评测组件直接读 author、game、content 等后端字段；这一版先只保留页面真正需要的预览数据。",
    coverImage: "/home-night-sky.jpg",
    rating: 7.5,
    readingTime: "5 min read",
    tags: ["Drama", "Essay"],
    body: createReviewBody([
      "夜空题材适合慢一点的排版。这里的正文宽度、行高和背景遮罩都偏克制，主要服务阅读，而不是做资讯站。",
      "后续如果需要更成熟的模板，可以继续沿着这个数据形状扩展：增加作者、平台、游玩时间、外部链接，都不会破坏页面边界。",
    ]),
  },
];

export function getReviewBySlug(slug: string) {
  return reviewItems.find((review) => review.slug === slug);
}
