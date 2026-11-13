// Run with: node --test ".github/scripts/*.test.mjs"
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "renovate-changeset.mjs");
const PR = "4242";
const CHANGESET = `.changeset/renovate-${PR}.md`;
const API_CLIENT = "packages/api-client/package.json";

const BASE_MANIFESTS = {
  "packages/api-client/package.json": {
    name: "@open-dpp/api-client",
    version: "1.0.0",
    dependencies: { "@open-dpp/dto": "workspace:*", axios: "^1.18.0" },
    devDependencies: { vitest: "^3.0.0" },
  },
  "packages/dto/package.json": {
    name: "@open-dpp/dto",
    version: "1.0.0",
    peerDependencies: { zod: "^4.0.0" },
  },
  "apps/main/package.json": {
    name: "@open-dpp/main",
    version: "1.0.0",
    private: true,
    dependencies: { "better-auth": "^1.3.0" },
  },
  "apps/e2e/package.json": {
    name: "e2e",
    version: "1.0.0",
    private: true,
    dependencies: { "@playwright/test": "^1.50.0" },
  },
  "docs/package.json": { name: "@open-dpp/docs", version: "1.0.0", private: true },
};

let repo;

function git(...args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" });
}

function writeJson(path, value) {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(path) {
  return JSON.parse(readFileSync(join(repo, path), "utf8"));
}

function updateManifest(path, update) {
  writeJson(path, update(readJson(path)));
}

function setDependency(path, field, name, range) {
  updateManifest(path, (pkg) => ({ ...pkg, [field]: { ...pkg[field], [name]: range } }));
}

function commit(message) {
  git("add", "--all");
  git("commit", "--quiet", "--message", message);
}

function runScript(args) {
  return spawnSync("node", [SCRIPT, ...args], { cwd: repo, encoding: "utf8" });
}

function run(...extraArgs) {
  return runScript(["main", PR, ...extraArgs]);
}

function changeset() {
  const path = join(repo, CHANGESET);
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "renovate-changeset-"));
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.com");
  git("config", "commit.gpgsign", "false");
  writeJson(".changeset/config.json", { fixed: [["@open-dpp/*"]], ignore: ["e2e"] });
  Object.entries(BASE_MANIFESTS).forEach(([path, manifest]) => writeJson(path, manifest));
  commit("base");
  git("checkout", "--quiet", "-b", "renovate/some-update");
});

afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe("renovate-changeset", () => {
  test("writes a patch changeset for a runtime dependency bump in a published package", () => {
    setDependency(API_CLIENT, "dependencies", "axios", "^1.20.0");
    commit("bump axios");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      changeset(),
      [
        "---",
        '"@open-dpp/api-client": patch',
        "---",
        "",
        "Update dependencies:",
        "",
        "- @open-dpp/api-client: `axios` ^1.18.0 → ^1.20.0",
        "",
      ].join("\n"),
    );
  });

  test("lists peer dependencies, additions and removals, one release line per package", () => {
    setDependency("packages/dto/package.json", "peerDependencies", "zod", "^4.1.0");
    updateManifest(API_CLIENT, (pkg) => ({
      ...pkg,
      dependencies: { "@open-dpp/dto": "workspace:*", ky: "^1.0.0" },
    }));
    commit("swap axios for ky, bump zod");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      changeset(),
      [
        "---",
        '"@open-dpp/api-client": patch',
        '"@open-dpp/dto": patch',
        "---",
        "",
        "Update dependencies:",
        "",
        "- @open-dpp/api-client: `axios` ^1.18.0 → (removed)",
        "- @open-dpp/api-client: `ky` (added) → ^1.0.0",
        "- @open-dpp/dto: `zod` ^4.0.0 → ^4.1.0",
        "",
      ].join("\n"),
    );
  });

  test("lists devDependency and optionalDependency bumps, marking the dev ones", () => {
    setDependency(API_CLIENT, "devDependencies", "vitest", "^4.0.0");
    setDependency(API_CLIENT, "optionalDependencies", "fsevents", "^2.3.0");
    commit("bump vitest, add fsevents");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      changeset(),
      [
        "---",
        '"@open-dpp/api-client": patch',
        "---",
        "",
        "Update dependencies:",
        "",
        "- @open-dpp/api-client: `fsevents` (added) → ^2.3.0",
        "- @open-dpp/api-client: `vitest` ^3.0.0 → ^4.0.0 (dev)",
        "",
      ].join("\n"),
    );
  });

  test("lists a dependency once when a runtime field and devDependencies change it alike", () => {
    updateManifest("packages/dto/package.json", (pkg) => ({
      ...pkg,
      devDependencies: { zod: "^4.0.0" },
    }));
    commit("declare zod as a dev dependency too");
    git("checkout", "--quiet", "main");
    git("merge", "--quiet", "--ff-only", "renovate/some-update");
    git("checkout", "--quiet", "renovate/some-update");
    setDependency("packages/dto/package.json", "peerDependencies", "zod", "^4.1.0");
    setDependency("packages/dto/package.json", "devDependencies", "zod", "^4.1.0");
    commit("bump zod");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.match(changeset(), /^- @open-dpp\/dto: `zod` \^4\.0\.0 → \^4\.1\.0$/m);
    assert.equal(changeset().match(/`zod`/g).length, 1);
  });

  test("ignores internal workspace references", () => {
    setDependency(API_CLIENT, "dependencies", "@open-dpp/dto", "workspace:^");
    commit("switch to workspace:^");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(changeset(), null);
  });

  test("includes private packages", () => {
    setDependency("apps/main/package.json", "dependencies", "better-auth", "^1.4.0");
    commit("bump better-auth");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.match(changeset(), /^"@open-dpp\/main": patch$/m);
    assert.match(changeset(), /^- @open-dpp\/main: `better-auth` \^1\.3\.0 → \^1\.4\.0$/m);
  });

  test("writes nothing for a lockfile-only change", () => {
    writeFileSync(join(repo, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    commit("lock file maintenance");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(changeset(), null);
  });

  test("never names a package the changesets config ignores", () => {
    setDependency("apps/e2e/package.json", "dependencies", "@playwright/test", "^1.55.0");
    commit("bump playwright");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(changeset(), null);
  });

  test("compares against the merge-base, so changes made on main only are not listed", () => {
    git("checkout", "--quiet", "main");
    setDependency("packages/dto/package.json", "peerDependencies", "zod", "^4.2.0");
    commit("bump zod on main");
    git("checkout", "--quiet", "renovate/some-update");
    setDependency(API_CLIENT, "dependencies", "axios", "^1.20.0");
    commit("bump axios");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(changeset(), /zod/);
    assert.match(changeset(), /`axios` \^1\.18\.0 → \^1\.20\.0/);
  });

  test("rewrites a stale changeset and deletes it once the PR no longer qualifies", () => {
    setDependency(API_CLIENT, "dependencies", "axios", "^1.20.0");
    commit("bump axios");
    writeFileSync(join(repo, CHANGESET), "stale\n");

    assert.equal(run().status, 0);
    assert.match(changeset(), /\^1\.18\.0 → \^1\.20\.0/);

    setDependency(API_CLIENT, "dependencies", "axios", "^1.18.0");
    commit("revert axios");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.equal(changeset(), null);
  });

  test("lists every dependency of a package the PR adds", () => {
    writeJson("packages/sdk/package.json", {
      name: "@open-dpp/sdk",
      version: "1.0.0",
      dependencies: { ky: "^1.0.0" },
    });
    commit("add sdk package");

    const result = run();

    assert.equal(result.status, 0, result.stderr);
    assert.match(changeset(), /^"@open-dpp\/sdk": patch$/m);
    assert.match(changeset(), /^- @open-dpp\/sdk: `ky` \(added\) → \^1\.0\.0$/m);
  });

  test("names the manifest it cannot parse", () => {
    writeFileSync(join(repo, "packages/dto/package.json"), "{ not json\n");
    commit("break dto manifest");

    const result = run();

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /packages\/dto\/package\.json/);
  });

  test("rejects a PR number that is not numeric", () => {
    const result = runScript(["main", "../../etc/passwd"]);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /Usage/);
  });

  test("reports an unknown option before the usage", () => {
    const result = run("--include-private");

    assert.equal(result.status, 2);
    assert.match(result.stderr, /Unknown option '--include-private'/);
    assert.match(result.stderr, /Usage/);
  });
});
