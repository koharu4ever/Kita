import type { CollectionConfig } from "payload";

import { isAuthenticated } from "../access/is-authenticated";
import { contentEditor } from "../fields/content-editor";
import {
  validateRequiredText,
  validateRequiredTextarea,
  validateSlug,
} from "../fields/validators";

export const Reviews: CollectionConfig = {
  slug: "reviews",
  admin: {
    description:
      "撰写图文评论。草稿仅在后台可读；保存为 Published 后才能从公开页面访问。",
    defaultColumns: [
      "title",
      "gameTitle",
      "status",
      "publishedAt",
      "rating",
      "updatedAt",
    ],
    useAsTitle: "title",
  },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: ({ req }) =>
      req.user
        ? true
        : {
            status: {
              equals: "published",
            },
          },
    update: isAuthenticated,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      validate: validateRequiredText,
    },
    {
      name: "slug",
      type: "text",
      admin: {
        description:
          "文章地址：小写英文、数字和连字符；不要使用 random 或 preview。发布后修改会影响链接及评论。",
        position: "sidebar",
      },
      required: true,
      unique: true,
      validate: validateSlug,
    },
    {
      name: "status",
      type: "select",
      admin: {
        position: "sidebar",
        description:
          "Draft 不对外展示；Published 保存后公开。这里不是自动保存或历史版本系统。",
      },
      defaultValue: "draft",
      index: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      required: true,
    },
    {
      name: "gameTitle",
      type: "text",
      admin: { description: "文章讨论的游戏名，不要求先创建 Game。" },
      required: true,
      validate: validateRequiredText,
    },
    {
      name: "publishedAt",
      type: "date",
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: "sidebar",
        description: "展示日期，不是定时发布任务。",
      },
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      admin: {
        description: "列表卡片与文章首屏使用的简短摘要，正文写在 Body 中。",
      },
      required: true,
      validate: validateRequiredTextarea,
    },
    {
      name: "coverImage",
      type: "text",
      admin: {
        description:
          "文章封面路径或已配置的 R2 图片 URL。正文图片请在 Body 工具栏选择 Media。",
      },
      required: true,
      validate: validateRequiredText,
    },
    {
      name: "rating",
      type: "number",
      admin: { position: "sidebar", description: "0–10 分。" },
      max: 10,
      min: 0,
      required: true,
    },
    {
      name: "readingTime",
      type: "text",
      admin: {
        position: "sidebar",
        description: "预计阅读时间，例如 5 min read。",
      },
      required: true,
      validate: validateRequiredText,
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          validate: validateRequiredText,
        },
      ],
    },
    {
      name: "body",
      type: "richText",
      label: "Body / 正文",
      admin: {
        description:
          "使用固定工具栏或输入 / 插入标题、Media 图片和分隔线；选中文字可设置格式或链接。H2–H4 自动生成前台目录。图片说明在每次插入处单独填写。",
      },
      editor: contentEditor,
      required: true,
    },
  ],
};
