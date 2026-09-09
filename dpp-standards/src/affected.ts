/**
 * `pnpm --filter @open-dpp/dpp-standards matrix:affected --trigger <text|code|check|manual> …`
 * Prints the Criteria a trigger touches, with the reason each is in scope. Read-only; `matrix:run`
 * writes the same list into a run entry. Flags: PLAYBOOK.md, section "Scope".
 */
import { parseArgs } from "node:util";
import { stringify } from "yaml";
import { gitChangedFiles, gitRevParse } from "./git";
import { formatProblems, loadConformance, REPO_DIR } from "./load";
import { computeScope, countReasons } from "./scope";
import { parseScopeRequest, SCOPE_OPTIONS } from "./scope-request";

const { values } = parseArgs({
  options: { ...SCOPE_OPTIONS, json: { type: "boolean", default: false } },
});

const { data, problems } = loadConformance();
if (problems.length > 0) {
  process.stderr.write(`warning, matrix files have problems:\n${formatProblems(problems)}\n`);
}

try {
  const request = parseScopeRequest(values, () => gitRevParse(REPO_DIR, "main"));
  const scope = computeScope(data.standards, request, gitChangedFiles(REPO_DIR));
  process.stdout.write(
    values.json ? `${JSON.stringify({ request, scope }, null, 2)}\n` : stringify({ scope }),
  );
  process.stderr.write(
    `${scope.length} criteria in scope ${JSON.stringify(countReasons(scope))}\n`,
  );
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
