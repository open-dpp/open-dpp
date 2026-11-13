// Keeps `.changeset/renovate-<pr>.md` in sync with the dependency changes a
// Renovate PR makes to released workspace packages (all but those the
// changesets config ignores). devDependencies count too: build tools such as
// Rspack, Vite and TypeScript produce what ships. Deletes the file again when
// the PR no longer changes any. A lockfile-only PR gets none, since no
// manifest names a package it changes. Node built-ins only: this runs with a
// write token, so it must not install the PR's dependencies.
//
// Usage: node .github/scripts/renovate-changeset.mjs <base-ref> <pr-number>
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

// devDependencies last: a dependency that changes alike in a runtime field as
// well (the usual way to declare a peer) keeps only its runtime entry.
const DEPENDENCY_FIELDS = [
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
  "devDependencies",
];
// Mirrors the `packages` globs in pnpm-workspace.yaml.
const WORKSPACE_MANIFESTS = [
  ":(glob)apps/*/package.json",
  ":(glob)packages/*/package.json",
  "docs/package.json",
];
const CHANGESET_CONFIG = ".changeset/config.json";
const USAGE = "Usage: renovate-changeset.mjs <base-ref> <pr-number>";

// Returns `{ options }`, or `{ error }` to print above the usage.
function parseCli(argv) {
  try {
    const { positionals } = parseArgs({ args: argv, allowPositionals: true, options: {} });
    const [baseRef, prNumber] = positionals;
    // The PR number becomes part of a file path, so accept digits only.
    if (positionals.length !== 2 || !/^\d+$/.test(prNumber)) {
      return { error: "Expected a base ref and a numeric PR number." };
    }
    return { options: { baseRef, prNumber } };
  } catch (error) {
    return { error: error.message };
  }
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function parseJson(text, source) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Cannot parse ${source}: ${error.message}`, { cause: error });
  }
}

function readManifestAt(ref, path) {
  // Empty output: the package did not exist at that ref.
  if (git("ls-tree", "--name-only", ref, "--", path).trim() === "") {
    return null;
  }
  return parseJson(git("show", `${ref}:${path}`), `${path} at ${ref}`);
}

function dependencyChanges(before, after, workspaceNames) {
  const changes = DEPENDENCY_FIELDS.flatMap((field) => {
    const from = before?.[field] ?? {};
    const to = after[field] ?? {};
    return [...new Set([...Object.keys(from), ...Object.keys(to)])]
      .filter((dep) => from[dep] !== to[dep] && !workspaceNames.has(dep))
      .map((dep) => ({ dep, from: from[dep], to: to[dep], dev: field === "devDependencies" }));
  });
  const sameChange = (a, b) => a.dep === b.dep && a.from === b.from && a.to === b.to;
  return changes.filter(
    (change, index) => changes.findIndex((other) => sameChange(change, other)) === index,
  );
}

function renderChangeset(entries) {
  const releases = [...new Set(entries.map(({ name }) => name))].map((name) => `"${name}": patch`);
  const lines = entries.map(
    ({ name, dep, from, to, dev }) =>
      `- ${name}: \`${dep}\` ${from ?? "(added)"} → ${to ?? "(removed)"}${dev ? " (dev)" : ""}`,
  );
  return ["---", ...releases, "---", "", "Update dependencies:", "", ...lines, ""].join("\n");
}

const cli = parseCli(process.argv.slice(2));
if (cli.error) {
  console.error(`${cli.error}\n${USAGE}`);
  process.exit(2);
}
const { baseRef, prNumber } = cli.options;

const mergeBase = git("merge-base", baseRef, "HEAD").trim();
const manifests = git("ls-files", "--", ...WORKSPACE_MANIFESTS)
  .split("\n")
  .filter(Boolean)
  .map((path) => ({ path, pkg: parseJson(readFileSync(path, "utf8"), path) }));
const workspaceNames = new Set(manifests.map(({ pkg }) => pkg.name));
// Packages the release ignores (apps/e2e) must never appear in a changeset.
// Exact names only: changesets also accepts globs here, which this does not expand.
const ignored = new Set(
  parseJson(readFileSync(CHANGESET_CONFIG, "utf8"), CHANGESET_CONFIG).ignore ?? [],
);

const entries = manifests
  .filter(({ pkg }) => !ignored.has(pkg.name))
  .flatMap(({ path, pkg }) =>
    dependencyChanges(readManifestAt(mergeBase, path), pkg, workspaceNames).map((change) => ({
      name: pkg.name,
      ...change,
    })),
  );

const changesetPath = `.changeset/renovate-${prNumber}.md`;
if (entries.length === 0) {
  rmSync(changesetPath, { force: true });
  console.log("No dependency changes in released packages.");
} else {
  const content = renderChangeset(entries);
  writeFileSync(changesetPath, content);
  console.log(`Wrote ${changesetPath}:\n${content}`);
}
