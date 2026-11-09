import { plugin as shadcn } from "@shadcn/lint";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import vueParser from "vue-eslint-parser";

// ESLint runs only the @shadcn/lint design-system rules. Oxlint (.oxlintrc.json)
// does everything else, but it cannot read Vue templates, where the client's
// classes live.
export default defineConfig([
  // ESLint matches every .js/.mjs/.cjs file by default; only the client sources below are linted.
  globalIgnores(["**/*.{js,mjs,cjs}"]),
  {
    files: ["apps/client/src/**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser },
    },
  },
  {
    files: ["apps/client/src/**/*.ts"],
    languageOptions: { parser: tsParser },
  },
  {
    files: ["apps/client/src/**/*.{vue,ts}"],
    plugins: { shadcn },
    settings: {
      shadcn: {
        // PrimeVue components are auto-imported, so they are matched by tag name.
        ui: "primevue",
        // App components are imported by relative path into src/components.
        componentImports: ["/components/"],
        note: "See DESIGN.md for the token map and design rules.",
      },
    },
    rules: {
      "shadcn/no-raw-colors": "error",
      // PrimeIcons (`pi pi-*`) are loaded globally in main.ts.
      "shadcn/no-unknown-classes": ["error", { allow: ["pi", "pi-*"] }],
      "shadcn/no-arbitrary-values": "error",
      // PrimeVue sizes columns and dialogs through their `style` prop.
      "shadcn/no-inline-styles": [
        "error",
        { contracts: [{ pattern: "^(Column|Dialog)$", allow: ["width"] }] },
      ],
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
      "shadcn/require-static-classes": "error",
    },
  },
]);
