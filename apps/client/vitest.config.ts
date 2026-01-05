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
  resolve: {
    alias: [
      {
        find: /^@open-dpp\/(.*)$/,
        replacement: path.resolve(__dirname, "../../packages/$1/src"),
      },
      {
        // removes .js extension from relative imports
        find: /^(\.{1,2}\/.*)\.js$/,
        replacement: "$1",
      },
    ],
  },
  envDir: path.resolve(__dirname, "../../../"),
});
