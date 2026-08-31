import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";

/**
 * Walks up from `startDir` and returns the `version` of the nearest
 * `package.json` that declares one. A `package.json` without a version — such
 * as the workspace root — is skipped rather than treated as a match.
 */
export function findPackageVersion(startDir: string): string | undefined {
  let directory = startDir;
  for (;;) {
    const candidate = join(directory, "package.json");
    if (existsSync(candidate)) {
      try {
        const parsed = JSON.parse(readFileSync(candidate, "utf8")) as { version?: unknown };
        if (typeof parsed.version === "string" && parsed.version.length > 0) {
          return parsed.version;
        }
      } catch {
        // Unreadable or malformed package.json: keep walking up rather than
        // failing — the version is non-critical information.
      }
    }
    const parent = dirname(directory);
    if (parent === directory) {
      return undefined;
    }
    directory = parent;
  }
}

/**
 * Where to start looking, most precise first. `__dirname` covers the CommonJS
 * build, but is undefined when Jest loads this module as ESM, so the entrypoint
 * and the working directory serve as fallbacks.
 */
function startDirectories(): string[] {
  const directories: string[] = [];
  if (typeof __dirname !== "undefined") {
    directories.push(__dirname);
  }
  const entrypoint = process.env.OPEN_DPP_BACKEND_MAIN;
  if (entrypoint) {
    directories.push(dirname(entrypoint));
  }
  directories.push(process.cwd());
  return directories;
}

let cached: { version: string | undefined } | undefined;

/**
 * The version of the package this build was made from. Cached because it cannot
 * change while the process is running.
 */
export function readBundledPackageVersion(): string | undefined {
  cached ??= {
    version: startDirectories()
      .map((directory) => findPackageVersion(directory))
      .find((version) => version !== undefined),
  };
  return cached.version;
}
