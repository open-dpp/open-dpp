// Rspack config for `nest build` / `nest start` (nest-cli.json `"builder": "rspack"`).
//
// The CLI loads this file with a dynamic import(), so under `"type": "module"` it is ESM and
// must `export default` a function. The CLI calls it as `factory(defaultOptions, rspack)` and
// shallow-merges the result over its own defaults:
//   { ...defaultOptions, mode: watch ? "development" : "none", ...returned }
// so every nested object touched below spreads the CLI default first.
//
// The output is one ESM bundle, `dist/main.js`. Workspace packages (`@open-dpp/*`) are
// bundled from their `src/`; every other bare specifier stays external and is loaded from
// node_modules at runtime.

import { createRequire } from "node:module";
import { dirname, relative } from "node:path";

const require = createRequire(import.meta.url);

/** Bundled from packages/<name>/src through their `exports`. */
const BUNDLED_SCOPE = /^@open-dpp\//;

const isBundledRequest = (request) =>
  request.startsWith(".") || request.startsWith("/") || BUNDLED_SCOPE.test(request);

/** `dayjs/plugin/utc` → { pkg: "dayjs", subpath: "plugin/utc" }; undefined for a bare package. */
const splitDeepImport = (request) => {
  const parts = request.split("/");
  const nameLength = request.startsWith("@") ? 2 : 1;
  return parts.length > nameLength
    ? { pkg: parts.slice(0, nameLength).join("/"), subpath: parts.slice(nameLength).join("/") }
    : undefined;
};

const hasExportsMap = (pkg) => {
  try {
    return "exports" in require(`${pkg}/package.json`);
  } catch {
    return true; // builtins (node:fs/promises) and packages hiding package.json
  }
};

/** Node's ESM resolver adds no file extensions inside a package without an
 *  `exports` map (`import "dayjs/plugin/utc"` → ERR_MODULE_NOT_FOUND), while
 *  require() did. Rewrite such deep imports to the file require() would load. */
const toNodeEsmRequest = (request) => {
  const deep = splitDeepImport(request);
  if (!deep || hasExportsMap(deep.pkg)) {
    return request;
  }
  const packageDir = dirname(require.resolve(`${deep.pkg}/package.json`));
  return `${deep.pkg}/${relative(packageDir, require.resolve(request))}`;
};

/** A package that ships ESM ("type": "module" or an `import` export condition)
 *  is imported natively; builtins and packages hiding package.json count as ESM. */
const shipsEsm = (pkg) => {
  try {
    const manifest = require(`${pkg}/package.json`);
    return (
      manifest.type === "module" || JSON.stringify(manifest.exports ?? {}).includes('"import"')
    );
  } catch {
    return true;
  }
};

/** Every bare specifier (builtins, node_modules) stays external. ESM packages
 *  become a static `import`; CJS-only packages are `require`d (node-commonjs),
 *  because Node's native import of CJS only exposes the named exports its lexer
 *  detects (`import { merge } from "lodash"` → undefined), whereas tsc's CommonJS
 *  output always required them. A bare specifier imported by a bundled workspace
 *  package must be a direct `dependency` of apps/main, or Node fails at startup:
 *  `pnpm deploy --prod` ships exactly those. */
const externaliseBareSpecifiers = ({ request }, callback) => {
  if (!request || isBundledRequest(request)) {
    return callback();
  }
  const pkg = splitDeepImport(request)?.pkg ?? request;
  return shipsEsm(pkg)
    ? callback(null, `module ${toNodeEsmRequest(request)}`)
    : callback(null, `node-commonjs ${request}`);
};

/** Never exclude a workspace package from swc, even when it resolves under node_modules/.pnpm
 *  (`injectWorkspacePackages`). */
const isThirdPartySource = (resourcePath) =>
  resourcePath.includes("node_modules") && !resourcePath.includes("@open-dpp");

export default (options) => {
  const [swcRule] = options.module.rules; // the CLI registers exactly one rule
  return {
    ...options,
    externals: [externaliseBareSpecifiers],
    module: {
      ...options.module,
      rules: [{ ...swcRule, exclude: isThirdPartySource }],
      parser: {
        javascript: {
          // Leave import.meta.* to Node at runtime (the default inlines the build
          // machine's source path for import.meta.url; also rspack#15695).
          importMeta: false,
        },
      },
    },
    optimization: {
      ...options.optimization,
      // `Foo.name` references (Mongoose models, DI tokens) must never be mangled.
      minimize: false,
      concatenateModules: false,
      mangleExports: false,
    },
  };
};
