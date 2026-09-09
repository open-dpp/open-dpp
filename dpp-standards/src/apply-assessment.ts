/**
 * One-off helper for an Assess session: set the `assessment` block on named Criteria of a matrix
 * file from a JSON batch, preserving the file's comments and formatting (yaml Document). Not a
 * committed workflow script; the playbook writes assessments this way to keep BATT.yaml legible.
 *
 * Usage: tsx src/apply-assessment.ts <ID> <batch.json>
 * batch.json: [ { "id": "BATT-Art77(1)", "assessment": { ...AssessmentSchema } }, ... ]
 */
import fs from "node:fs";
import path from "node:path";
import { isMap, isSeq, parseDocument, type YAMLMap } from "yaml";
import { toYaml } from "./history";
import { MATRIX_DIR, relative } from "./load";
import { AssessmentSchema } from "./schema";

const [standard, batchFile] = process.argv.slice(2);
if (!standard || !batchFile) {
  process.stderr.write("usage: tsx src/apply-assessment.ts <ID> <batch.json>\n");
  process.exit(1);
}
const matrixFile = path.join(MATRIX_DIR, `${standard}.yaml`);
const doc = parseDocument(fs.readFileSync(matrixFile, "utf8"));
const criteria = doc.get("criteria");
if (!isSeq(criteria)) {
  throw new Error("no criteria list");
}
const byId = new Map(
  criteria.items
    .filter((i): i is YAMLMap => isMap(i))
    .map((i) => [String(i.get("id")), i] as const),
);

const batch = JSON.parse(fs.readFileSync(batchFile, "utf8")) as {
  id: string;
  assessment: unknown;
}[];
const applied: string[] = [];
for (const { id, assessment } of batch) {
  const node = byId.get(id);
  if (!node) {
    throw new Error(`unknown criterion ${id}`);
  }
  const parsed = AssessmentSchema.safeParse(assessment);
  if (!parsed.success) {
    throw new Error(
      `${id}: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
    );
  }
  node.set("assessment", doc.createNode(assessment));
  applied.push(id);
}
fs.writeFileSync(matrixFile, toYaml(doc));
process.stdout.write(`${relative(matrixFile)}: wrote ${applied.length} assessment(s)\n`);
