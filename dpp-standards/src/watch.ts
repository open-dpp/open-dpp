/**
 * `pnpm --filter @open-dpp/dpp-standards matrix:watch [--json]`
 * Runs the Cellar query and prints the acts `watch-state.yaml` has not seen. Read-only: the
 * Validation Run classifies each new act and records it in the state file (PLAYBOOK.md, "Watch").
 * Inside GitHub Actions it also writes `new=<count>` to GITHUB_OUTPUT.
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { newRows, parseSparqlJson, toMarkdown } from "./cellar";
import { formatProblems, loadConformance, PACKAGE_DIR, relative, WATCH_STATE_FILE } from "./load";

const { values } = parseArgs({ options: { json: { type: "boolean", default: false } } });

const fail = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const { data, problems } = loadConformance();
if (!data.watch) {
  fail(`${relative(WATCH_STATE_FILE)} is missing or invalid:\n${formatProblems(problems)}`);
}
const { endpoint, query, seen } = data.watch.cellar;
const url = new URL(endpoint);
url.searchParams.set("query", fs.readFileSync(path.join(PACKAGE_DIR, query), "utf8"));

const response = await fetch(url, { headers: { Accept: "application/sparql-results+json" } });
if (!response.ok) {
  fail(`Cellar answered HTTP ${response.status} for ${endpoint}`);
}
const rows = parseSparqlJson(await response.json());
const fresh = newRows(seen, rows);

process.stdout.write(values.json ? `${JSON.stringify(fresh, null, 2)}\n` : toMarkdown(fresh));
process.stderr.write(
  `${rows.length} acts returned, ${seen.length} already seen, ${fresh.length} new\n`,
);
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `new=${fresh.length}\n`);
}
