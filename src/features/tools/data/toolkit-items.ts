import type { ToolkitItem } from "@/features/tools/types/toolkit-item";

export const toolkitItems: ToolkitItem[] = [
  {
    id: "text-hooking",
    title: "Text Hooking: 把游戏文本抓出来",
    postedOn: "2026-06-09",
    summary:
      "日文视觉小说的第一道工具线通常是文本抓取。先让游戏文本从画面里出来，再交给词典、翻译或笔记系统处理。",
    links: [
      {
        label: "Textractor",
        href: "https://github.com/Artikash/Textractor",
        note: "经典文本抓取工具，适合先作为基础方案了解。",
      },
      {
        label: "Clipboard Inserter",
        href: "https://github.com/0xDC00/scripts",
        note: "把抓取文本送往剪贴板或其他脚本流程时可以继续研究。",
      },
    ],
  },
  {
    id: "locale",
    title: "Locale & Runtime: 让旧游戏先跑起来",
    postedOn: "2026-06-09",
    summary:
      "很多旧 galgame 的问题不是游戏坏了，而是区域、字体、编码、运行库没有准备好。这类工具先解决启动环境。",
    links: [
      {
        label: "Locale Emulator",
        href: "https://github.com/xupefei/Locale-Emulator",
        note: "旧日文游戏常见的区域模拟方案。",
      },
      {
        label: "Visual C++ Redistributable",
        href: "https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist",
        note: "缺少运行库时，很多老游戏会直接无法启动。",
      },
    ],
  },
  {
    id: "databases",
    title: "Databases: 找版本、会社、发售和补丁",
    postedOn: "2026-06-09",
    summary:
      "这部分像旧互联网时代的入口页：不是写长文，而是把经常要查的资料站放在一个地方。",
    links: [
      {
        label: "VNDB",
        href: "https://vndb.org/",
        note: "查视觉小说条目、版本、Staff、标签和相关作品。",
      },
      {
        label: "Bangumi",
        href: "https://bgm.tv/",
        note: "中文语境下很好用的条目、评分和短评入口。",
      },
    ],
  },
  {
    id: "screen",
    title: "Screen & Capture: 截图、缩放和记录",
    postedOn: "2026-06-09",
    summary:
      "截图和缩放不是装饰，它们决定你之后能不能把某个场景、台词或界面状态留下来。",
    links: [
      {
        label: "ShareX",
        href: "https://getsharex.com/",
        note: "Windows 上常用的截图和标注工具。",
      },
      {
        label: "Magpie",
        href: "https://github.com/Blinue/Magpie",
        note: "窗口缩放工具，适合研究旧游戏的显示效果。",
      },
    ],
  },
];
