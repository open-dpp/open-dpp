import path from "node:path";
import { PrimeVueResolver } from "@primevue/auto-import-resolver";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        PrimeVueResolver(),
      ],
    }),
  ],
  build: {
    target: "es2022",
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
