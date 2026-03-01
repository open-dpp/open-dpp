import path from "node:path";

import vue from "@vitejs/plugin-vue";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    exclude: [...configDefaults.exclude],
    setupFiles: "./setupTest.ts",
    environment: "jsdom",
  },
  ssr: {
    noExternal: ["zod-vue-i18n"],
  },
  resolve: {
    alias: [
      {
        find: /^@open-dpp\/(.*)$/,
        replacement: path.resolve(__dirname, "../../packages/$1/src"),
      },
    ],
  },
  envDir: path.resolve(__dirname, "../../../"),
});
