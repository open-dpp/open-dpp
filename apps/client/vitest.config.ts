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
  envDir: path.resolve(__dirname, "../../../"),
});
