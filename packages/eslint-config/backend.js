// @ts-check

import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import perfectionist from "eslint-plugin-perfectionist";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import globals from "globals";
import { defineConfig } from "eslint/config";

/**
 * Shared ESLint configuration for Node/backend services (e.g. backend API, pdf-service).
 * Uses typescript-eslint strict + stylistic rules and perfectionist for import/order.
 * Apps should extend with tseslint.config(...backendConfig, { languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } } }).
 */
export const backendConfig = defineConfig(
  {
    ignores: [
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  perfectionist.configs["recommended-natural"],
);
