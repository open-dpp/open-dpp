---
status: accepted
date: 2026-06-06
---

# Jump `@open-dpp/*` to 2.3.0 to clear burned npm versions

`@open-dpp/api-client` was published from `1.0.0` up to `2.2.2` during 2025, then the
whole package was unpublished and reset to `0.1.0` in April 2026. npm **permanently
reserves** unpublished version numbers: they do not appear in `npm view <pkg> versions`
(so `changesets`' publish check — which relies on `npm info` — believes they are free),
yet `npm publish` rejects them with `E400 Cannot publish over previously published
version`. Because every `@open-dpp/*` package shares one changesets `fixed` group, the
group was bumped to `1.0.0`; `@open-dpp/dto@1.0.0` published fine but `@open-dpp/api-client@1.0.0`
is burned, so the Release workflow failed on every push to `main` (no tag, no Docker image).

We **keep the fixed group** and do a one-time manual bump of all `@open-dpp/*` packages
to **`2.3.0`** — the burned range tops out at `2.2.2`, so `2.3.0` is free for both published
packages and every future bump from it stays clear. We also added a **preflight guard** to
`.github/workflows/release.yml` that, before publishing, diffs each publishable package's
`npm view time` keys (every version ever published, including burned ones) against its live
`npm view versions` and hard-fails with an actionable message if a local target version sits
in the burned set — the check `changesets` itself cannot perform.

## Considered options

- **Split `api-client`/`dto` out of the fixed group** so `api-client` stays on its safe `0.x`
  line. Rejected: the repo-wide `v<version>` tag + Docker-dispatch steps rely on
  `publishedPackages[0].version` being a single repo-wide version; splitting makes that
  ambiguous and lets the packages' versions diverge.
- **Minimal patch bump to `1.0.1`.** Rejected: `1.0.1` is free, but it re-arms the trap — the
  next minor (`1.1.0`) and major (`2.0.0`) are also burned for `api-client`.
- **Swallow the publish error (`continue-on-error`).** Rejected: it greens the job while the
  burned package silently never publishes, recreating the `dto`/`api-client` misalignment
  invisibly.
- **Jump to `3.0.0`** (a cleaner "fresh major"). Equally valid; we chose the minimal
  clear-the-range jump to `2.3.0`.

## Consequences

- `@open-dpp/api-client` live versions skip `1.x` and `2.0`–`2.2` forever; those numbers are
  burned on npm and can never be reissued.
- `@open-dpp/dto@1.0.0` remains a live published version. We deliberately **do not unpublish
  anything** — unpublishing is the root cause of this whole situation.
- **Never unpublish a published `@open-dpp/*` package.** It permanently burns the version
  number and defeats `changesets`' publish detection.
