/**
 * Writes the Check report of a conformance run: `conformance-report.json` (folded into the matrix by
 * `matrix:fold`) and `conformance-report.md` (pasted into a "Validation Run requested" issue).
 * Only tests carrying the `check` annotation count; nothing is written when none ran.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { FullConfig, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { CHECK_ANNOTATION } from "./annotation";
import { readSubject, SUBJECT_FILE, subjectSummary } from "./subject";

export type CheckStatus = "passed" | "failed" | "skipped";
export type CheckEntry = {
  id: string;
  title: string;
  criteria: string[];
  status: CheckStatus;
  duration: number;
  error?: string;
};
export type CheckReport = {
  commit: string;
  date: string;
  baseUrl: string;
  subject?: Record<string, string>;
  checks: CheckEntry[];
};

const REPORT_DIR = path.join(__dirname, "../..");
const ANSI = /\x1b\[[0-9;]*m/g;

const statusOf = (result: TestResult): CheckStatus =>
  result.status === "passed" ? "passed" : result.status === "skipped" ? "skipped" : "failed";

const firstLine = (text: string | undefined): string | undefined =>
  text?.replace(ANSI, "").split("\n")[0]?.trim() || undefined;

/** One report entry per Check, from the test's last result. */
export const toEntry = (test: TestCase, result: TestResult): CheckEntry | undefined => {
  const id = test.annotations.find((a) => a.type === CHECK_ANNOTATION)?.description;
  if (!id) {
    return undefined;
  }
  const status = statusOf(result);
  return {
    id,
    title: test.title.replace(`${id}: `, ""),
    criteria: test.tags.map((t) => t.replace(/^@/, "")),
    status,
    duration: result.duration,
    ...(status === "failed" ? { error: firstLine(result.error?.message) ?? result.status } : {}),
  };
};

export const toMarkdown = (report: CheckReport): string =>
  [
    `Check report of ${report.date} at commit \`${report.commit.slice(0, 8)}\` against ${report.baseUrl}`,
    "",
    "| Check | Status | Criteria | Detail |",
    "| --- | --- | --- | --- |",
    ...report.checks.map(
      (c) =>
        `| \`${c.id}\` | ${c.status} | ${c.criteria.map((id) => `\`${id}\``).join(", ")} | ${c.error ?? ""} |`,
    ),
    "",
  ].join("\n");

/**
 * The commit of the Instance under test: OPEN_DPP_COMMIT when the Instance was built from another
 * checkout than the one running the Checks (a worktree at the assessed commit), else this checkout.
 */
const commitOf = (): string => {
  const override = process.env.OPEN_DPP_COMMIT?.trim();
  if (override && /^[0-9a-f]{7,40}$/i.test(override)) {
    return override;
  }
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPORT_DIR, encoding: "utf8" }).trim();
  } catch {
    return "0000000";
  }
};

export default class ConformanceReporter implements Reporter {
  private readonly entries = new Map<string, CheckEntry>();
  private baseUrl = "";

  onBegin(config: FullConfig): void {
    this.baseUrl = process.env.OPEN_DPP_URL ?? config.projects[0]?.use.baseURL ?? "";
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const entry = toEntry(test, result);
    if (entry) {
      this.entries.set(entry.id, entry);
    }
  }

  onEnd(): void {
    if (this.entries.size === 0) {
      return;
    }
    const report: CheckReport = {
      commit: commitOf(),
      date: new Date().toISOString().slice(0, 10),
      baseUrl: this.baseUrl,
      ...(fs.existsSync(SUBJECT_FILE) ? { subject: subjectSummary(readSubject()) } : {}),
      checks: [...this.entries.values()].sort((a, b) => a.id.localeCompare(b.id)),
    };
    fs.writeFileSync(
      path.join(REPORT_DIR, "conformance-report.json"),
      JSON.stringify(report, null, 2),
    );
    fs.writeFileSync(path.join(REPORT_DIR, "conformance-report.md"), toMarkdown(report));
    const counts = report.checks.reduce<Record<string, number>>(
      (acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }),
      {},
    );
    process.stdout.write(
      `Check report: ${JSON.stringify(counts)} -> apps/e2e/conformance-report.json\n`,
    );
  }
}
