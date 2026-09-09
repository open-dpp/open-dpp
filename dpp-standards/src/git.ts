/** The two git lookups the playbook scripts need. Kept apart from the pure scope rule. */
import { execFileSync } from "node:child_process";
import type { ChangedFiles } from "./scope";

const git = (repoDir: string, args: string[]): string =>
  execFileSync("git", args, { cwd: repoDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

export const gitChangedFiles =
  (repoDir: string): ChangedFiles =>
  (from, to, paths) =>
    git(repoDir, ["diff", "--name-only", `${from}..${to}`, "--", ...paths])
      .split("\n")
      .filter((line) => line.length > 0);

export const gitRevParse = (repoDir: string, ref: string): string =>
  git(repoDir, ["rev-parse", ref]).trim();
