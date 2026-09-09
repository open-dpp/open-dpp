/** CI gate: `pnpm --filter @open-dpp/dpp-standards matrix:check`. Exits 1 on any schema or cross-file problem. */
import { type StatusCounts, totalOf } from "./counts";
import { formatProblems, loadConformance } from "./load";
import { DERIVED_STATUSES } from "./schema";

const { data, problems } = loadConformance();

const byStatus = (counts: StatusCounts): string =>
  DERIVED_STATUSES.map((status) => `${status} ${counts[status]}`).join(", ");

const lines = data.standards.map((s) => {
  const mirrors = totalOf(s.inheritedCounts);
  const inherited = mirrors > 0 ? `; ${mirrors} Mirrors inherit ${byStatus(s.inheritedCounts)}` : "";
  return `${s.standard.padEnd(10)} ${String(s.criteria.length).padStart(4)} criteria: ${byStatus(s.counts)}${inherited}`;
});
process.stdout.write(
  `${lines.join("\n")}\n${data.sources.length} sources registered, ${data.runs.length} validation run(s) recorded\n`,
);

if (problems.length > 0) {
  process.stderr.write(`\n${problems.length} problem(s):\n${formatProblems(problems)}\n`);
  process.exit(1);
}
process.stdout.write("Conformance Matrix files are valid.\n");
