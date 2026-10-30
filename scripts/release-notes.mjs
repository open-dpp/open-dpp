// Prints the combined release notes for one version of the `fixed` group.
//
//   node scripts/release-notes.mjs 6.3.3
//
// Collects the `## <version>` section from every workspace CHANGELOG.md,
// merges them under Major / Minor / Patch, and drops duplicates (a changeset
// that targets several packages appears in each of their changelogs). Used by
// the release workflow to create one `v<version>` GitHub release.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const WORKSPACE_DIRS = ["apps", "packages"];
const STANDALONE_PACKAGES = ["docs"];
const CHANGE_TYPES = ["Major Changes", "Minor Changes", "Patch Changes"];

const version = process.argv[2];
if (!version) {
  process.stderr.write("Usage: node scripts/release-notes.mjs <version>\n");
  process.exit(1);
}

const root = join(import.meta.dirname, "..");
const ignored = new Set(
  JSON.parse(readFileSync(join(root, ".changeset/config.json"), "utf8")).ignore ?? [],
);

const packageDirs = [
  ...WORKSPACE_DIRS.flatMap((dir) =>
    readdirSync(join(root, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(dir, entry.name)),
  ),
  ...STANDALONE_PACKAGES,
].sort();

const entriesByType = new Map(CHANGE_TYPES.map((type) => [type, new Set()]));

for (const dir of packageDirs) {
  const packageJsonPath = join(root, dir, "package.json");
  const changelogPath = join(root, dir, "CHANGELOG.md");
  if (!existsSync(packageJsonPath) || !existsSync(changelogPath)) continue;
  if (ignored.has(JSON.parse(readFileSync(packageJsonPath, "utf8")).name)) continue;

  for (const { type, entry } of parseSection(readFileSync(changelogPath, "utf8"), version)) {
    entriesByType.get(type)?.add(entry);
  }
}

const notes = CHANGE_TYPES.filter((type) => entriesByType.get(type).size > 0)
  .map((type) => `### ${type}\n\n${[...entriesByType.get(type)].join("\n\n")}`)
  .join("\n\n");

process.stdout.write(`${notes || "No user-facing changes in this release."}\n`);

// Returns the top-level bullet entries of a changelog's `## <version>`
// section, each with the `### <type>` heading it was listed under. An entry
// keeps its indented continuation lines and paragraphs.
function parseSection(markdown, version) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${version}`);
  if (start === -1) return [];

  const entries = [];
  let type;
  let current;
  const flush = () => {
    if (current && !current[0].startsWith("- Updated dependencies")) {
      entries.push({ type, entry: current.join("\n").trimEnd() });
    }
    current = undefined;
  };

  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    if (line.startsWith("### ")) {
      flush();
      type = line.slice(4).trim();
    } else if (line.startsWith("- ")) {
      flush();
      current = [line];
    } else if (current) {
      current.push(line);
    }
  }
  flush();
  return entries;
}
