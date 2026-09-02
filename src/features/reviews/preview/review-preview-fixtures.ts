import type { DefaultTypedEditorState } from "@payloadcms/richtext-lexical";
import rainCityImage from "../../../../public/reviews/preview/rain-city.webp";

import type {
  ReviewNavigation,
  ReviewPreview,
} from "@/features/reviews/types/review-preview";

type PreviewSection = {
  heading: string;
  paragraphs: string[];
};

function textNode(text: string) {
  return {
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

function paragraphNode(text: string) {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    textFormat: 0,
    textStyle: "",
    type: "paragraph",
    version: 1,
  };
}

function headingNode(text: string) {
  return {
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    tag: "h2",
    type: "heading",
    version: 1,
  };
}

function previewBody(
  introduction: string,
  sections: PreviewSection[],
  showIllustration = false,
) {
  return {
    root: {
      children: [
        paragraphNode(introduction),
        ...(showIllustration
          ? [
              {
                type: "upload",
                version: 3,
                relationTo: "media",
                value: {
                  url: rainCityImage.src,
                  width: rainCityImage.width,
                  height: rainCityImage.height,
                  mimeType: "image/webp",
                  alt: "雨夜里的城市与灯光",
                },
                fields: {
                  caption:
                    "正文插图与图注示例；仅用于本地预览，不写入 Media 或数据库。",
                },
              },
            ]
          : []),
        ...sections.flatMap((section) => [
          headingNode(section.heading),
          ...section.paragraphs.map(paragraphNode),
        ]),
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  } as DefaultTypedEditorState;
}

export const reviewPreviewFixtures: ReviewPreview[] = [
  {
    slug: "rain-city-after-midnight",
    title: "雨幕之后：一座城市如何成为叙事角色",
    gameTitle: "Rain Archive",
    date: "2026-08-28",
    excerpt:
      "当街灯、玻璃与远处的窗口反复出现，城市不再只是背景，而开始替角色保存没有说出口的情绪。",
    coverImage: "/reviews/preview/rain-city.webp",
    rating: 9,
    readingTime: "8",
    tags: ["氛围", "叙事", "城市"],
    body: previewBody(
      "这是一篇用于验证 Reviews 文章布局的本地预览内容。",
      [
        {
          heading: "城市不是布景",
          paragraphs: [
            "最好的环境叙事不会急着解释世界。它先让重复出现的空间形成记忆，再让一次微小变化成为事件。",
            "雨水模糊了远景，却把近处的灯光变得更清楚。视觉设计因此承担了角色没有说出的部分。",
          ],
        },
        {
          heading: "节奏来自停顿",
          paragraphs: [
            "这类作品真正困难的不是制造高潮，而是判断何时应该让玩家停下来。安静本身需要被设计。",
          ],
        },
        {
          heading: "最后的判断",
          paragraphs: [
            "当地点能够留下人物经过的痕迹，场景就拥有了叙事上的时间。这也是这段体验最值得记住的地方。",
          ],
        },
      ],
      true,
    ),
    updatedAt: "2026-08-28T12:00:00.000Z",
  },
  {
    slug: "forest-room-silence",
    title: "森林与房间之间：沉默空间的情绪设计",
    gameTitle: "Green Echo",
    date: "2026-08-23",
    excerpt:
      "门窗把自然切成一幅画，也把人物困在观看的位置。空间的边界由此成了故事最准确的隐喻。",
    coverImage: "/reviews/preview/forest-room.webp",
    rating: 8.5,
    readingTime: "6",
    tags: ["空间", "美术", "观察"],
    body: previewBody("预览文章使用博客现有图片，只用于本地界面评审。", [
      {
        heading: "被框住的绿色",
        paragraphs: [
          "画面把森林放在门窗之后，既提供出口，也提醒我们出口仍然隔着一层结构。",
        ],
      },
      {
        heading: "沉默如何被听见",
        paragraphs: [
          "环境声与长镜头让玩家意识到自己的等待。没有对白的段落因此不是空白，而是主动的叙事。",
        ],
      },
    ]),
    updatedAt: "2026-08-23T09:30:00.000Z",
  },
  {
    slug: "violet-window-journey",
    title: "黄昏列车没有终点",
    gameTitle: "Violet Line",
    date: "2026-08-17",
    excerpt:
      "移动的车厢、固定的窗框与不断变化的天空，组成了一种既向前又停滞的旅途感。",
    coverImage: "/reviews/preview/violet-window.webp",
    rating: 8,
    readingTime: "5",
    tags: ["旅途", "色彩", "短篇"],
    body: previewBody("这篇占位内容用于观察短标题与横向封面的组合。", [
      {
        heading: "窗外一直在变化",
        paragraphs: [
          "场景移动并不等于故事前进。真正推动叙事的是人物开始接受那些无法回到原样的事物。",
        ],
      },
      {
        heading: "紫色时刻",
        paragraphs: ["介于白昼和夜晚之间的色彩，让告别不必被写成明确的终点。"],
      },
    ]),
    updatedAt: "2026-08-17T18:20:00.000Z",
  },
  {
    slug: "burning-sky-farewell",
    title: "当天空燃烧时，游戏如何处理告别",
    gameTitle: "Afterglow",
    date: "2026-08-11",
    excerpt:
      "宏大的云层没有抢走人物的情感，反而给一次克制的离别提供了足够辽阔的余韵。",
    coverImage: "/reviews/preview/sunset-clouds.webp",
    rating: 9.5,
    readingTime: "11",
    tags: ["结局", "角色", "音乐"],
    body: previewBody("长篇 Review 需要在信息密度和阅读呼吸之间保持平衡。", [
      {
        heading: "高潮之前",
        paragraphs: [
          "作品没有把所有伏笔都留到最后一刻，而是提前让玩家理解代价。结局因此不是答案，而是兑现。",
          "当音乐减去大部分配器，只留下熟悉的旋律时，记忆比新信息更有力量。",
        ],
      },
      {
        heading: "告别之后",
        paragraphs: [
          "优秀的结尾会改变玩家回望前文的方式。曾经普通的选择，在知道结果以后获得了新的重量。",
        ],
      },
    ]),
    updatedAt: "2026-08-11T21:00:00.000Z",
  },
  {
    slug: "slow-adventure-under-stars",
    title: "银河之下的慢节奏冒险",
    gameTitle: "Night Field",
    date: "2026-08-04",
    excerpt:
      "没有倒计时，没有连续任务提示，只有一条夜路和偶尔亮起的灯。慢并不是缺少内容。",
    coverImage: "/reviews/preview/milky-way.webp",
    rating: 8.5,
    readingTime: "7",
    tags: ["探索", "节奏", "夜空"],
    body: previewBody(
      "预览内容同时用于检查目录、正文行宽和上一篇/下一篇导航。",
      [
        {
          heading: "把时间还给玩家",
          paragraphs: [
            "当系统不再频繁催促，玩家才会主动决定看什么、错过什么，以及什么时候继续向前。",
          ],
        },
        {
          heading: "空旷并不空洞",
          paragraphs: [
            "远景、脚步声和稀疏的灯光共同建立尺度。内容更少，却让每次相遇更加清晰。",
          ],
        },
      ],
    ),
    updatedAt: "2026-08-04T20:10:00.000Z",
  },
  {
    slug: "shooting-star-ending",
    title: "一颗流星足够照亮结局吗",
    gameTitle: "Blue Hour",
    date: "2026-07-29",
    excerpt:
      "短暂的光亮之所以成立，不是因为画面足够漂亮，而是因为故事已经教会玩家等待它。",
    coverImage: "/reviews/preview/shooting-star.webp",
    rating: 7.5,
    readingTime: "4",
    tags: ["结局", "意象", "短评"],
    body: previewBody("最后一篇预览用来检查六张卡片形成的信息流密度。", [
      {
        heading: "意象需要准备",
        paragraphs: [
          "如果一幅画面只在结尾突然出现，它最多是漂亮。只有反复出现又不断变化的意象，才能真正参与叙事。",
        ],
      },
      {
        heading: "仍然值得记住",
        paragraphs: [
          "它并不完美，但最后几分钟把前面分散的情绪收拢到了一起。对短篇作品来说，这已经足够。",
        ],
      },
    ]),
    updatedAt: "2026-07-29T19:45:00.000Z",
  },
];

export function getReviewPreviewFixture(slug: string) {
  return reviewPreviewFixtures.find((review) => review.slug === slug);
}

export function getReviewPreviewNavigation(slug: string): ReviewNavigation {
  const index = reviewPreviewFixtures.findIndex(
    (review) => review.slug === slug,
  );
  const previous = reviewPreviewFixtures[index + 1];
  const next = reviewPreviewFixtures[index - 1];

  return {
    previous: previous
      ? { date: previous.date, slug: previous.slug, title: previous.title }
      : undefined,
    next: next
      ? { date: next.date, slug: next.slug, title: next.title }
      : undefined,
  };
}
