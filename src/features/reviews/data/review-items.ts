export type ReviewPreview = {
  slug: string;
  title: string;
  gameTitle: string;
  date: string;
  excerpt: string;
  coverImage: string;
  rating: number;
  tags: string[];
};

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
    tags: ["Atmosphere", "Memory", "VN"],
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
    tags: ["Summer", "Slice of Life"],
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
    tags: ["Drama", "Essay"],
  },
];
