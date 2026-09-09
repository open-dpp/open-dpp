import { defineConfig } from "vitepress";
import { loadConformance } from "../../src/load";
import { TIERS } from "../../src/schema";

// Preview site of the Conformance Matrix. Loads the YAML files once at
// config time so the sidebar lists every text that has a matrix file.
const { data } = loadConformance();

const TIER_TITLES = { A: "EU law", B: "Harmonised standards", C: "Normative references" } as const;

const standardGroups = TIERS.flatMap((tier) => {
  const items = data.standards
    .filter((s) => s.source.tier === tier)
    .map((s) => ({ text: s.source.short ?? s.source.reference, link: `/standards/${s.slug}` }));
  return items.length > 0 ? [{ text: TIER_TITLES[tier], items }] : [];
});

export default defineConfig({
  title: "open-dpp Conformance Matrix",
  description: "Renderer of the Conformance Review matrix kept in dpp-standards/",
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      {
        text: "Repository",
        link: "https://github.com/open-dpp/open-dpp/tree/dpp-standard-compliance/dpp-standards",
      },
    ],
    sidebar: [
      {
        text: "Conformance Matrix",
        items: [
          { text: "Overview", link: "/" },
          { text: "Standards watch", link: "/watch" },
          { text: "Validation runs", link: "/runs" },
        ],
      },
      ...standardGroups,
    ],
    outline: false,
    socialLinks: [{ icon: "github", link: "https://github.com/open-dpp/open-dpp" }],
  },
  transformPageData(pageData) {
    const title = pageData.params?.title;
    return typeof title === "string" ? { title } : undefined;
  },
});
