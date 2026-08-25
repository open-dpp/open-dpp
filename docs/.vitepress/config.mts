import { defineConfig } from "vitepress";
import pkg from "../package.json" with { type: "json" };

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
      { text: "Rest API", link: "https://cloud.open-dpp.de/api" },
      {
        text: `v${pkg.version}`,
        link: "https://github.com/open-dpp/open-dpp/releases",
      },
    ],

    sidebar: {
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
