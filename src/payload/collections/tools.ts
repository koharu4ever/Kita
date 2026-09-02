import type { CollectionConfig } from "payload";

import { isAuthenticated } from "../access/is-authenticated";
import {
  validateHttpUrl,
  validateRequiredText,
  validateRequiredTextarea,
} from "../fields/validators";

export const Tools: CollectionConfig = {
  slug: "tools",
  admin: {
    description:
      "Tools 是外部资源目录，不是文章。这里编辑的资料会用于前台五种展示模式。",
    defaultColumns: ["title", "category", "sortOrder", "updatedAt"],
    useAsTitle: "title",
  },
  access: {
    create: isAuthenticated,
    delete: isAuthenticated,
    read: () => true,
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
      name: "description",
      type: "textarea",
      admin: {
        description:
          "简要说明用途、适用场景和注意事项；此字段使用纯文本，保证列表搜索与五种视图一致。",
      },
      required: true,
      validate: validateRequiredTextarea,
    },
    {
      name: "url",
      type: "text",
      admin: {
        description:
          "官方资源或项目地址，须包含 https:// 或 http://；来源站点由此自动推导。",
      },
      required: true,
      validate: validateHttpUrl,
    },
    {
      name: "category",
      type: "select",
      admin: {
        position: "sidebar",
        description: "内容分类，与前台五种展示模式不是同一个概念。",
      },
      defaultValue: "database",
      options: [
        { label: "Text Hooking", value: "text-hooking" },
        { label: "Runtime", value: "runtime" },
        { label: "Database", value: "database" },
        { label: "Capture", value: "capture" },
      ],
      required: true,
    },
    {
      name: "sortOrder",
      type: "number",
      admin: {
        position: "sidebar",
        description: "默认精选排序中，数值越小越靠前；前台仍可切换其他排序。",
      },
      defaultValue: 100,
      required: true,
    },
  ],
};
