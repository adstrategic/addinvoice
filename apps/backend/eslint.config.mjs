import { backendConfig } from "@addinvoice/eslint-config/backend";
import { defineConfig } from "eslint/config";

export default defineConfig(...backendConfig, {
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    "perfectionist/sort-modules": "off",
    "perfectionist/sort-objects": "off",
  },
});
