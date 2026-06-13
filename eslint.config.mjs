import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "_reference/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Use the typed env object from '@/config/env' instead of reading process.env directly.",
        },
      ],
    },
  },
  {
    files: ["payload.config.ts", "src/config/env.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
];

export default eslintConfig;
