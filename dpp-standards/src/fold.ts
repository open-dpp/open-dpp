/**
 * `pnpm --filter @open-dpp/dpp-standards matrix:fold <conformance-report.json>`
 * Folds a Check report into the matrix files: check evidence (result and date) on every assessed
 * Criterion a Check tags. Never changes a status; a failed check on a Met row fails `matrix:check`
 * until the Criterion is re-assessed. Prints what it added, updated, and which tagged Criteria are
 * still unassessed. Procedures: PLAYBOOK.md, "Fold in check results".
 */
import fs from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { toYaml } from "./history";
import { MATRIX_DIR, relative } from "./load";
import { CheckReportSchema, foldReport, standardsOf, type Touch } from "./report";

const fail = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const [reportFile] = process.argv.slice(2);
if (!reportFile) {
  fail("usage: matrix:fold <conformance-report.json>");
}
if (!fs.existsSync(reportFile)) {
  fail(`no report at ${reportFile}`);
}

const parsed = CheckReportSchema.safeParse(JSON.parse(fs.readFileSync(reportFile, "utf8")));
if (!parsed.success) {
  fail(
    `invalid report:\n${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n")}`,
  );
}
const report = parsed.data;

const line = (label: string, touches: Touch[]): string =>
  touches.length > 0
    ? `${label}:\n${touches.map((t) => `  ${t.criterion} ← ${t.check}`).join("\n")}\n`
    : "";

try {
  for (const standard of standardsOf(report)) {
    const file = path.join(MATRIX_DIR, `${standard}.yaml`);
    if (!fs.existsSync(file)) {
      fail(`report tags Criteria of ${standard}, but ${relative(file)} does not exist`);
    }
    const result = foldReport(parseDocument(fs.readFileSync(file, "utf8")), report);
    fs.writeFileSync(file, toYaml(result.matrix));
    process.stdout.write(
      `${relative(file)} (report of ${report.date} at ${report.commit.slice(0, 8)})\n${line("added", result.added)}${line("updated", result.updated)}${line("FAILED, re-assess", result.failing)}${line("tagged but not assessed", result.unassessed)}`,
    );
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
