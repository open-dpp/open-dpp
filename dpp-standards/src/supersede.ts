/**
 * `pnpm --filter @open-dpp/dpp-standards matrix:supersede <ID> [--all | <criterion id>…] [--retire <edition>]`
 * Moves the latest Assessment of the named Criteria of `matrix/<ID>.yaml` into `history/<ID>.yaml`,
 * creating the history file on first use. `--retire` also marks the Criteria dropped by an edition,
 * refused while another file still mirrors one of them. Run it before writing a new Assessment; the
 * schema refuses an Assessment on a retired Criterion.
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { parseDocument } from "yaml";
import { assessedIds, newHistoryDocument, supersede, toYaml } from "./history";
import { HISTORY_DIR, loadConformance, MATRIX_DIR, relative } from "./load";
import { blockingMirrors } from "./mirrors";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { all: { type: "boolean", default: false }, retire: { type: "string" } },
});
const [standard, ...named] = positionals;

const fail = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

if (!standard) {
  fail("usage: matrix:supersede <ID> [--all | <criterion id>...] [--retire <edition>]");
}
const matrixFile = path.join(MATRIX_DIR, `${standard}.yaml`);
const historyFile = path.join(HISTORY_DIR, `${standard}.yaml`);
if (!fs.existsSync(matrixFile)) {
  fail(`no matrix file ${relative(matrixFile)}`);
}

const matrix = parseDocument(fs.readFileSync(matrixFile, "utf8"));
const history = fs.existsSync(historyFile)
  ? parseDocument(fs.readFileSync(historyFile, "utf8"))
  : newHistoryDocument(standard);
const ids = values.all ? assessedIds(matrix) : named;
if (ids.length === 0) {
  fail(
    values.all
      ? "nothing to supersede: no Criterion carries an Assessment"
      : "no criterion ids given",
  );
}

if (values.retire !== undefined) {
  const blocked = blockingMirrors(ids, loadConformance().data.standards);
  if (blocked.length > 0) {
    fail(
      `cannot retire, still mirrored by another text:\n${blocked.map((b) => `  ${b.id} ← ${b.mirrors.join(", ")}`).join("\n")}\nre-point or retire those Mirrors first`,
    );
  }
}

try {
  const result = supersede(matrix, history, ids, values.retire);
  fs.writeFileSync(matrixFile, toYaml(result.matrix));
  if (result.moved.length > 0 || fs.existsSync(historyFile)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
    fs.writeFileSync(historyFile, toYaml(result.history));
  }
  const line = (label: string, list: string[]): string =>
    list.length > 0 ? `${label}: ${list.join(", ")}\n` : "";
  process.stdout.write(
    `${line(`moved to ${relative(historyFile)}`, result.moved)}${line("retired", result.retired)}${line("skipped (no assessment)", result.skipped)}`,
  );
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
