import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    supportFile: "cypress/support/component.ts",
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },
});
