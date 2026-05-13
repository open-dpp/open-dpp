import { defineConfig } from "vitepress";
import { useSidebar } from "vitepress-openapi";
import spec from "../api-docs.json" with { type: "json" };
import pkg from "../package.json" with { type: "json" };

const sidebar = useSidebar({
  spec,
  // Optionally, you can specify a link prefix for all generated sidebar items. Default is `/operations/`.
  linkPrefix: "/operations/",
});

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "open-dpp Documentation",
  description: "Documentation for the open-dpp project.",
  head: [["link", { rel: "icon", href: "/logo.svg" }]],
  ignoreDeadLinks: [/^https?:\/\/localhost/],
  themeConfig: {
    logo: {
      src: "/logo.svg",
      alt: "open-dpp Logo",
    },
    nav: [
      { text: "Home", link: "/home" },
      { text: "Rest API", link: "https://app.cloud.open-dpp.de/api" },
      {
        text: `v${pkg.version}`,
        link: "https://github.com/open-dpp/open-dpp/releases",
      },
    ],

    sidebar: {
      "/api": [
        {
          text: "Resources",
          items: sidebar
            .generateSidebarGroups({
              linkPrefix: "/api/operations/",
            })
            .map((group) => ({
              ...group,
              collapsed: true,
            })),
        },
      ],
      "/": {
        items: [
          {
            text: "Home",
            link: "/home/about",
            items: [
              { text: "About", link: "/home/about" },
              { text: "Getting started", link: "/home/getting-started" },
            ],
          },
          {
            text: "Reference",
            items: [{ text: "Configuration", link: "/reference/configuration" }],
          },
          {
            text: "Guides",
            items: [
              { text: "Passports", link: "/guides/passports" },
              { text: "Templates", link: "/guides/templates" },
              { text: "Branding", link: "/guides/branding" },
              { text: "AI Integration", link: "/guides/ai" },
              { text: "Development", link: "/guides/development" },
            ],
          },
        ],
      },
    },

    socialLinks: [{ icon: "github", link: "https://github.com/open-dpp/open-dpp" }],
  },
});
