/** One page per matrix file: `/standards/<slug>`. */
import { loadConformance } from "../../src/load";

export default {
  paths: () =>
    loadConformance().data.standards.map((s) => ({
      params: {
        slug: s.slug,
        standard: s.standard,
        title: `${s.source.reference}: ${s.source.title}`,
      },
    })),
};
