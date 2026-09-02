import type { CollectionConfig } from "payload";

import { isAuthenticated } from "../access/is-authenticated";
import { contentEditor } from "../fields/content-editor";
import {
  validateHttpUrl,
  validateRequiredText,
  validateRequiredTextarea,
  validateSlug,
} from "../fields/validators";

export const Games: CollectionConfig = {
  slug: "games",
  admin: {
    description:
      "管理游戏资料、封面与图文介绍。先选择 Media 封面，再保存发布状态。",
    defaultColumns: [
      "title",
      "developer",
      "playStatus",
      "publicationStatus",
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
            publicationStatus: {
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
        position: "sidebar",
        description:
          "游戏地址：小写英文、数字和连字符；不要使用 preview。发布后尽量保持不变。",
      },
      required: true,
      unique: true,
      validate: validateSlug,
    },
    {
      name: "originalTitle",
      type: "text",
    },
    {
      name: "developer",
      type: "text",
      required: true,
      validate: validateRequiredText,
    },
    {
      name: "releaseDate",
      type: "text",
      admin: {
        description: "展示文本，例如 2024-03-29 或 TBA，不会执行定时任务。",
      },
      required: true,
      validate: validateRequiredText,
    },
    {
      name: "playStatus",
      type: "select",
      admin: { position: "sidebar" },
      defaultValue: "planned",
      options: [
        { label: "Finished", value: "finished" },
        { label: "Playing", value: "playing" },
        { label: "Planned", value: "planned" },
      ],
      required: true,
    },
    {
      name: "publicationStatus",
      type: "select",
      admin: {
        position: "sidebar",
        description: "Draft 仅在后台可读，Published 保存后进入公开画廊。",
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
      name: "summary",
      type: "textarea",
      admin: {
        description: "详情页开头的简短介绍；长篇图文内容写在 Body 中。",
      },
      required: true,
      validate: validateRequiredTextarea,
    },
    {
      name: "body",
      type: "richText",
      label: "Body / 正文",
      admin: {
        description:
          "支持标题、列表、引用、链接、行内代码、正文图片和图片说明；从工具栏或 / 菜单插入。",
      },
      editor: contentEditor,
      required: true,
    },
    {
      name: "cover",
      type: "upload",
      admin: {
        description:
          "必填封面。重复使用图片时选择已有 Media；正文插图也可复用同一图片。",
      },
      relationTo: "media",
      required: true,
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
      name: "links",
      type: "array",
      admin: {
        description: "添加官方站点、商店或参考链接，地址须为 HTTP(S)。",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          validate: validateRequiredText,
        },
        {
          name: "href",
          type: "text",
          required: true,
          validate: validateHttpUrl,
        },
      ],
    },
  ],
};
