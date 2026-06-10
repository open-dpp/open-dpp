// .vitepress/theme/index.ts
import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { theme, useOpenapi } from "vitepress-openapi/client";
import "vitepress-openapi/dist/style.css";
import "./custom.css";
import VitePressMermaid from "../plugins/vitepress-mermaid/index.vue";

import spec from "../../api-docs.json" with { type: "json" };

export default {
  extends: DefaultTheme,

  async enhanceApp({ app, router, siteData }) {
    // Set the OpenAPI specification.
    useOpenapi({
      spec,
      config: {},
    });
    app.component("vitepress-mermaid", VitePressMermaid);
    theme.enhanceApp({ app, router, siteData });
    // register your custom global components
  },
} satisfies Theme;
