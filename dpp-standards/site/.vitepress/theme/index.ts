import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import ConformanceMatrix from "./components/ConformanceMatrix.vue";
import ConformanceSummary from "./components/ConformanceSummary.vue";
import StandardsWatch from "./components/StandardsWatch.vue";
import ValidationRuns from "./components/ValidationRuns.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("ConformanceMatrix", ConformanceMatrix);
    app.component("ConformanceSummary", ConformanceSummary);
    app.component("StandardsWatch", StandardsWatch);
    app.component("ValidationRuns", ValidationRuns);
  },
} satisfies Theme;
