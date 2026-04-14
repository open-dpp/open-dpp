import { usePaths } from "vitepress-openapi";
import spec from "../../api-docs.json" with { type: "json" };
export default {
  paths() {
    return usePaths({ spec })
      .getPathsByVerbs()
      .map(({ operationId, summary }) => {
        return {
          params: {
            operationId,
            pageTitle: `${summary} - vitepress-openapi`,
          },
        };
      });
  },
};
