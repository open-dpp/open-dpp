import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    target: "es2022",
  },
  resolve: {
    preserveSymlinks: true,
    alias: [
      {
        find: /^@open-dpp\/(.*)$/,
        replacement: path.resolve(__dirname, "../../packages/$1/src"),
      },
    ],
  },
  envDir: path.resolve(__dirname, "../../../"),
});
