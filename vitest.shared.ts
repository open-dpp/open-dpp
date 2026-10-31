import path from "node:path";
import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * Vitest settings shared by `apps/main` and the workspace packages. Each workspace merges
 * this into its own `vitest.config.ts` (`mergeConfig`), so Turbo keeps one `test` task per
 * workspace. `apps/client` has its own config (Vue, jsdom) and does not use this file.
 */
export default defineConfig({
  plugins: [
    // Vite's own transformer cannot emit `design:paramtypes`, which Nest's DI reads, so SWC
    // transforms every TypeScript file instead.
    swc.vite({
      // ESM output: `vi.mock` and `resolve.alias` only see `import`, never `require`.
      module: { type: "es6" },
      // Spelled out instead of inferred from the nearest tsconfig.json: a spec in apps/main
      // also transforms `packages/*/src` under those packages' tsconfigs, and not all of them
      // enable `experimentalDecorators` although their sources are decorated.
      jsc: {
        target: "es2022",
        parser: { syntax: "typescript", decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        // Mongoose model names and DI tokens come from `Foo.name`.
        keepClassNames: true,
      },
    }),
  ],
  resolve: {
    // Workspace packages are tested from source, the same alias apps/client uses.
    alias: [
      {
        find: /^@open-dpp\/(.*)$/,
        replacement: path.resolve(__dirname, "packages/$1/src"),
      },
    ],
  },
  test: {
    environment: "node",
    // A fresh child process per spec file: native modules (sharp) stay out of worker
    // threads, and module state (the mongoose singleton, better-auth) never crosses files.
    pool: "forks",
    isolate: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.spec.ts"],
    },
  },
});
