/**
 * `pnpm --filter @open-dpp/dpp-standards matrix:run --trigger <kind> --detail "<why>" …`
 * Opens a Validation Run: computes the scope (same flags as matrix:affected), appends the entry to
 * runs.yaml with `reviewer: pending`, and prints it. Optional: --requested-by <issue>, --date, --validator.
 */
import fs from "node:fs";
import { parseArgs } from "node:util";
import { isSeq, parseDocument, stringify, type YAMLSeq } from "yaml";
import { gitChangedFiles, gitRevParse } from "./git";
import { toYaml } from "./history";
import { formatProblems, loadConformance, relative, REPO_DIR, RUNS_FILE } from "./load";
import { newRunId } from "./run-id";
import { computeScope, countReasons, sourcesOf } from "./scope";
import { parseScopeRequest, SCOPE_OPTIONS } from "./scope-request";
import { AGENT_VALIDATOR, PENDING_REVIEWER, type Run, RunSchema } from "./schema-runs";

const { values } = parseArgs({
  options: {
    ...SCOPE_OPTIONS,
    detail: { type: "string" },
    "requested-by": { type: "string" },
    date: { type: "string", default: new Date().toISOString().slice(0, 10) },
    validator: { type: "string", default: AGENT_VALIDATOR },
  },
});

const fail = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const { data, problems } = loadConformance();
if (problems.length > 0) {
  process.stderr.write(`warning, matrix files have problems:\n${formatProblems(problems)}\n`);
}
if (!values.detail) {
  fail("--detail is required: one line on why this run happens");
}

try {
  const request = parseScopeRequest(values, () => gitRevParse(REPO_DIR, "main"));
  const scope = computeScope(data.standards, request, gitChangedFiles(REPO_DIR));
  const commit = request.kind === "code" ? request.commit : gitRevParse(REPO_DIR, "main");
  const sources = request.kind === "text" ? [...request.sources] : sourcesOf(scope);
  const requestedBy = values["requested-by"] ? Number(values["requested-by"]) : undefined;
  const run: Run = RunSchema.parse({
    id: newRunId(
      values.date,
      request,
      data.runs.map((r) => r.id),
    ),
    date: values.date,
    trigger: { kind: request.kind, detail: values.detail },
    ...(requestedBy ? { requestedBy } : {}),
    commit,
    sources,
    scope,
    validator: values.validator,
    reviewer: PENDING_REVIEWER,
  });

  const doc = parseDocument(fs.readFileSync(RUNS_FILE, "utf8"));
  const existing = doc.get("runs");
  const runs = isSeq(existing) ? existing : (doc.createNode([]) as YAMLSeq);
  // `runs: []` starts life as a flow sequence; entries are written in block style.
  runs.flow = false;
  runs.add(doc.createNode(run));
  doc.set("runs", runs);
  fs.writeFileSync(RUNS_FILE, toYaml(doc));
  process.stdout.write(stringify(run));
  process.stderr.write(
    `run ${run.id} appended to ${relative(RUNS_FILE)}: ${scope.length} criteria ${JSON.stringify(countReasons(scope))}\n`,
  );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
