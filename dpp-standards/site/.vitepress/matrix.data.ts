/** VitePress build-time data loader: every page reads the Conformance Matrix through `data`. */
import { defineLoader } from "vitepress";
import {
  type ConformanceData,
  formatProblems,
  hardProblems,
  loadConformance,
} from "../../src/load";

declare const data: ConformanceData;
export { data };

export default defineLoader({
  watch: [
    "../../matrix/*.yaml",
    "../../history/*.yaml",
    "../../sources.yaml",
    "../../runs.yaml",
    "../../watch-state.yaml",
  ],
  load(): ConformanceData {
    const { data: loaded, problems } = loadConformance();
    // The pending-reviewer gate fails matrix:check but must not block the preview: a run in review
    // renders with its reviewer marked pending. Only schema/cross-reference problems are fatal here.
    const fatal = hardProblems(problems);
    if (fatal.length > 0) {
      throw new Error(`Conformance Matrix invalid:\n${formatProblems(fatal)}`);
    }
    return loaded;
  },
});
