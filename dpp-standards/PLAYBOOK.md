# Conformance Review playbook

What an agent or a human does to change the Conformance Matrix, in three procedures sized to one
session each: **Extract** (a text becomes Criteria), **Assess** (a text's first Assessments) and
**Re-validate** (a trigger's Criteria assessed again). A pass of Assess or Re-validate is a
**Validation Run**: dated, scoped, against one commit, with a validator and a reviewer of record.
Vocabulary: `CONTEXT.md`, sections "Reviews (shared)" and "Conformance Review". File rules and
schema: `README.md`, read it first. Design decisions: wayfinder ticket #754.

## Before any procedure

1. **Branch.** Work on `dpp-standard-compliance` until `dpp-standards/` lives on `main`, then on
   `main`; either way the procedure's changes go on a new branch `conformance/<run id>` (Extract:
   `conformance/extract-<source id>`) and land by PR. Done when `git status` is clean on that branch.
2. **Commit under assessment.** Every Assessment records a commit on `main`: run `git fetch origin
main` and use `origin/main` (the scripts default to `main`). Done when the SHA is noted.
3. **Texts.** Every source in scope with `access: gated` has its `localFile` from `sources.yaml`
   present under `standards/` (git-ignored, never committed). A missing text blocks the Criteria of
   that source: leave them Not assessed, note it in the run, and point at ticket #750, which
   procures texts. Public texts are fetched from the `url` in `sources.yaml` (EUR-Lex refuses
   non-browser clients; use `http://publications.europa.eu/resource/celex/<CELEX>`).
4. **Tooling.** `pnpm install` done, `gh auth status` succeeds, `pnpm --filter
@open-dpp/dpp-standards matrix:check` reports the files valid (a pending reviewer on an older
   run is the one acceptable problem).

## Choose the procedure

| Situation                                                                     | Procedure                                       |
| ----------------------------------------------------------------------------- | ----------------------------------------------- |
| A text is not in `sources.yaml`, or has no `matrix/<ID>.yaml`                 | Extract                                         |
| A registered text got a new edition, consolidation or final version           | Extract, then Re-validate with a `text` trigger |
| A matrix file exists and its Criteria are Not assessed                        | Assess                                          |
| A new open-dpp release, a check regression, a watch hit, or a named Criterion | Re-validate                                     |
| A "Validation Run requested" issue exists                                     | Re-validate, `--requested-by` its number        |
| A "Standards watch" issue exists (the weekly query found unseen acts)         | Re-validate (its Watch step classifies them), or Extract when an act joins the scope |

## Scope

The **scope** of a Validation Run is computed, never guessed: `matrix:affected` prints it and
`matrix:run` writes it into the run entry, one line per Criterion with its reason. Retired Criteria
never enter a scope.

| Trigger  | Flags                                          | Criteria in scope, with reason                                                                                                                                                                  |
| -------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`   | `--sources <ids>`                              | every Criterion of those texts, plus every law row they operationalise (`operationalisedBy`): `text change`                                                                                     |
| `code`   | `--commit <sha>` (default `main`), `--sources` | every unassessed Criterion: `not assessed`; every Criterion whose `code`, `test` or `doc` evidence path changed since its assessed commit: `evidence changed`; every Partial or Gap: `open gap` |
| `check`  | `--check <check ids>`                          | every Criterion carrying that check id as evidence: `check regression` (ids from `conformance-report.json`, status `failed`)                                                                    |
| `manual` | `--criteria <ids>`                             | exactly those: `manual`; a Mirror named here resolves to its target                                                                                                                             |
| any      |                                                | every active Mirror of a Criterion in scope, after the base entries: `mirror of <target id>` (derived, see below)                                                                                |

A first Assess of a text is a `code` trigger with `--sources <ID>`: every Criterion is `not
assessed`. A second `matrix:run` on the same day and scope gets a numeric suffix.

**Mirrors in a scope** (decided in #829). A Mirror is **listed** in the run's `scope` as a derived
entry, reason `mirror of <target id>`, and its text joins the run's `sources`: the reviewer of
record signs for every row whose displayed status the run changes, and the derived entries are
those rows. The Assessment is always written on the target; a derived entry asks for one thing,
that the Mirror still holds (the clause still restates the target with no delta). If a delta
appeared, the Mirror becomes an own Criterion, which is an Extract change of its text, not part of
the run. A Mirror whose own text changed enters as `text change` and is not listed twice; a `code`
trigger never lists a Mirror as `not assessed`, it has nothing of its own to assess; `--criteria`
naming a Mirror scopes its target and the Mirror rides along as derived.

## Procedure Extract

Copyright rule first (`README.md`): a paraphrase in our words per clause, never a sentence of a
gated text.

1. **Register the text.** Add or update its entry in `sources.yaml`: `edition` is the exact version
   read, `watch` names where its next change shows up, `localFile` for gated texts. Done when
   `matrix:check` accepts the file.
2. **Read the text with the `research` skill.** For an EN, Annex ZA first: it maps clauses to ESPR
   articles, which fills `operationalisedBy` on the law rows. One Criterion per clause or article
   paragraph, `applicability` from who the clause binds, `areas` from
   `research/capability-inventory.md`, `accessClass` where Annex XIII of the Batteries Regulation
   fixes one. Done when every clause of the text is either a Criterion or noted as pure preamble.
   **Mirror or own Criterion.** A clause of a Sector law or a delegated act that restates a Criterion
   of another text (typically an ESPR article) with the same software obligation and no delta of any
   kind is a **Mirror**: `mirrors: <target id>`, no `assessment`, `applicability` equal to the
   target's. Any delta makes it an own Criterion assessed on its own: a different or narrower actor
   list, a fixed granularity (type, batch, item), a retention or availability period, a fixed value
   where ESPR leaves it to a delegated act, a replaced or added document, a different carrier
   placement, a clause that folds two ESPR points into one. Name the related id in the paraphrase
   or notes so the lineage stays visible. One target per Mirror, never a Mirror of a Mirror, never
   a retired target. The seed `research/criteria-sector-laws.md` tags candidate rows; verify each
   against the text before declaring it.
3. **New edition of a registered text.** Ids of surviving clauses stay as they are. Move their
   Assessments to history and retire the dropped clauses **before** touching the file by hand:

   ```
   pnpm --filter @open-dpp/dpp-standards matrix:supersede <ID> --all
   pnpm --filter @open-dpp/dpp-standards matrix:supersede <ID> --retire "<new edition>" <dropped ids>
   ```

   `--retire` refuses a Criterion another text still mirrors: re-point or retire those Mirrors first
   (in that text's own Extract). Then append the new clauses, bump `edition` and `extractedAt`. Done
   when no Criterion of the old edition is missing (retired or kept) and the section list matches
   the new text.

4. **Gate.** `matrix:check` green, `matrix:build` green.
5. **PR.** Title `Extract <ID> <edition>`, body naming the text, the edition and the Criterion count.
   No run entry: an Extract writes no Assessment. Done when the PR is open and this session ends;
   the Assess of that text is the next session.

## Procedure Assess

1. **Open the run.**

   ```
   pnpm --filter @open-dpp/dpp-standards matrix:run --trigger code --sources <ID>[,<ID>] --detail "first assessment of <ID> <edition>"
   ```

   Done when `runs.yaml` holds the entry with `reviewer: pending` and the printed scope matches
   the assessment ticket.

2. **Assess every Criterion in scope, in file order.** For each: read the clause in the text, find
   what open-dpp does (`research/capability-inventory.md` is the map, the code is the truth),
   write the `assessment` block. `status` by the rules in `README.md`; `operational: true` when an
   operator must do something for the requirement to hold; `evidence` refs are repo paths at the
   assessed commit, check ids, or a dated `manual` description of what was tried; `notes` carry
   the reasoning a reviewer needs. A Criterion whose text is missing stays unassessed with the
   reason in the run's `notes`. Done when every scope entry has an Assessment or a noted reason.
3. **Fold in check results.** Run the Checks against a live Instance built from the assessed commit
   and fold the Check report into the matrix; the fold writes `check` evidence (with `result` and
   `date`) on every assessed Criterion a passing or failing Check tags and never touches a status:

   ```
   OPEN_DPP_URL=<origin of the Instance under test> pnpm exec dotenvx run -f .env.dev -f .env -- pnpm --filter e2e conformance
   pnpm --filter @open-dpp/dpp-standards matrix:fold apps/e2e/conformance-report.json
   ```

   The report records the commit of the Instance under test: the checkout's `HEAD`, or
   `OPEN_DPP_COMMIT=<sha>` when the Instance was built elsewhere (a `git worktree` at the assessed
   commit, the reliable way to test the commit the run records while the branch is behind `main`).

   A failing Check on a Met row makes `matrix:check` fail until the Criterion is re-assessed; the
   fold prints which tagged Criteria are still unassessed so they can be assessed in this run. A
   Check is evidence, never a status: Met still needs the code pointer and, where operational, the
   docs. Done when the report of this commit is folded and `matrix:check` reports only the pending
   reviewer.

4. **File the Gaps** (section "Gap issues"). Done when every Partial or Gap has a `gapIssue`.
5. **Gate.** `matrix:check` reports exactly one problem, the pending reviewer of this run;
   `matrix:build` succeeds.
6. **Adversarial review** (section below). Mandatory when a Criterion flipped from Partial or Gap
   to Met; recommended for every first Assess with a Met.
7. **PR and hand-off** (section "PR and reviewer of record").

## Procedure Re-validate

1. **Watch** (section "Watch"). Always first: a new act may change the trigger.
2. **Open the run** with the trigger that applies (section "Scope") and, when a "Validation Run
   requested" issue exists, `--requested-by <its number>` and its reason as `--detail`. Done when the
   entry is in `runs.yaml` and the scope reads as expected; an empty scope is a valid run (record
   the watch findings, open the PR with the run entry alone).
3. **Supersede before re-assessing.** Per text, move the current Assessments of the Criteria in
   scope to history:

   ```
   pnpm --filter @open-dpp/dpp-standards matrix:supersede <ID> <ids in scope with an assessment>
   ```

   Done when those Criteria carry no `assessment` and `history/<ID>.yaml` gained one entry each.
   Derived entries (`mirror of …`) are not superseded: a Mirror carries nothing to move, and the
   script refuses one by name.

4. **Assess every Criterion in scope** as in Assess, steps 2 and 3. A derived entry is done when
   the Mirror still holds (section "Scope"); its status follows the target's new Assessment. A `code` trigger means
   re-reading the evidence at the new commit, not the clause; a `text` trigger means re-reading the
   clause too.
5. **Gaps.** New Partial or Gap: section "Gap issues". A Criterion that moved from Partial or Gap
   to Met: its Gap issue closes through the PR (`Closes #N` in the body) only when the issue tracks
   no other open Criterion; otherwise tick the Criterion in the issue's checklist and comment.
6. **Gate**, as in Assess step 5.
7. **Adversarial review.** Mandatory when any Criterion flipped to Met.
8. **PR and hand-off.**

## Checks

A **Check** is one Playwright test in `apps/e2e/tests/conformance/` declared with the `check()` helper:
a stable id `<class>.<name>`, the Criterion ids it evidences (its tags) and a black-box assertion
against the Instance under test. The `conformance-setup` project mints the subject (one published
passport with a GS1 identity and a draft twin); `pnpm --filter e2e conformance` runs setup, subject
and Checks and writes `apps/e2e/conformance-report.json` and `.md` through the reporter. Classes in
v1, one Check or more each: resolver behaviour, identifier syntax (GS1 Syntax Engine), access
control, export format (aas-core metamodel verification), API contract (served OpenAPI), accessibility
(axe-core on the public view), transport security (HSTS, skipped on plain http). Adding a Check: tag
only Criterion ids that exist in the matrix files (`matrix:fold` rejects unknown ids), one
requirement per Check, the id never changes once folded. Tag the target of a Mirror, never the
Mirror (`matrix:fold` rejects that too); the Mirror shows the check through its target. Not checkable and left manual: the EU
registry (no exercisable API), data carriers (QR rendered client-side), organisational duties.
Registry, carrier and EN-clause Criteria get their tags in the assessment sessions once the texts are
extracted. Running the Checks in CI is a follow-up ticket; v1 runs locally.

## Watch

The watch has a mechanical half and a manual half; both are recorded in the run.

- **Mechanical:** `pnpm --filter @open-dpp/dpp-standards matrix:watch` runs the Cellar query of
  `research/eurlex-dpp-acts.rq` and prints the acts `watch-state.yaml` has not seen (a
  requested-run issue already carries this table when the workflow ran it, and the weekly schedule
  of `conformance-validation-run.yml` opens or updates one "Standards watch" issue whenever the
  query returns an unseen act; recording the dispositions in `watch-state.yaml` closes that issue
  through the PR). The query matches DPP
  and battery-passport acts, anything naming ESPR, the Batteries Regulation or a Sector law
  (2024/3110, 2025/2509, 2026/405), so supplementing, amending and consolidated acts surface.
  Classify each new act and append it to `seen` with the run id:
  - a product-group delegated act under ESPR, a Sector law (a Union act that mandates a DPP
    registered in the ESPR registry), or a delegated or implementing act under any registered
    source: `extracted` after running Extract on it as its own source (the map decided these join
    on adoption; #749 and #767);
  - a corrigendum or consolidated text of a registered source: `registered`, and the run's
    trigger becomes `text` for that source;
  - anything else that looks in scope: `pending decision`, plus one `conformance` issue asking the
    map owner; the scope of the review widens only by that decision;
  - the rest, including the CPR implementing acts on harmonised technical specifications the
    Regulation-number match brings in: `out of scope`.
- **Manual:** walk the `watch` block of every source in `sources.yaml` (its `url` and `lookFor`)
  and the rows of `research/public-sources.md`, section 6, that name no source. Write what changed,
  or "no change", into the run's `watch.notes`.

## Gap issues

One `conformance` issue per **Gap cluster**: the feature or change whose delivery would close the
Gaps, not one issue per Criterion. Search first (`gh issue list --label conformance --search
"<theme>"` and the issues the map names: #579 registry, #596 backup URL, #489 GS1 2D code, #518
and #523 identifier schemes, #522 battery template, #189 UNTP/EPCIS, #597 granularity, #516 DIN
norm); link an existing issue by setting `gapIssue` to it and adding the Criterion to its checklist.
A new issue: title `[<primary criterion id>] <what is missing>`, label `conformance`, body with the
paraphrased requirement, a checklist of every Criterion it tracks, the severity by source (law, then
an EN cited in the OJ, then an uncited EN, then a referenced standard) and a link to the matrix file.
Several Criteria share one `gapIssue` number.

## Adversarial review

A fresh agent session (or subagent) that has not seen the run reads the PR diff, the texts and the
code, and writes its objections as a PR **comment** (GitHub refuses reviews on one's own PR). The
verdict is advisory: the comment opens with `Blocking objections: <n>`, and the reviewer of record
treats any number above zero as do-not-merge until resolved. Record the count and the comment URL
in the run entry's `adversarialReview`. Prompt to give it, verbatim:

> You are the adversarial reviewer of a Conformance Review Validation Run of open-dpp. Read
> `dpp-standards/README.md` and `dpp-standards/PLAYBOOK.md`, then the diff of this PR. For the run
> in `runs.yaml`: re-run `matrix:affected` with the run's trigger and confirm the scope is complete.
> For every Assessment in the diff: confirm each `code`, `test` and `doc` evidence path exists at
> the assessed commit and that the test or check actually asserts the paraphrased requirement;
> read the clause in the text (gated copies are under `standards/`) and confirm the paraphrase and
> the status follow it; confirm no quoted span of a gated text exceeds eight words; confirm every
> Partial or Gap links an issue that describes it. Write a PR comment that opens with
> `Blocking objections: <n>`, then one bullet per objection with the Criterion id, what is wrong and
> what evidence would settle it, then the non-blocking remarks. Change no file.

## PR and reviewer of record

Branch `conformance/<run id>`. Title `Validation Run <run id>: <sources>`. Body: the trigger and
reason, the scope counts by reason, the status counts per text, the Gap issues opened or linked,
`Closes #<requested-run issue>` when one exists, `Closes #<gap issue>` for each Gap closed
(section Re-validate, step 5), and the adversarial review's count with a link. Set the run entry's
`pr` after opening. Hand-off: the PR is red on purpose until the reviewer of record replaces
`reviewer: pending` in `runs.yaml` with their name, which they do as the last step of review; that
edit is the human approval of every status in the run, Met included. The agent never merges.

## Guardrails

The agent writes Assessments, Gap issues, run entries, watch state, history entries and PRs. The
human merges, signs as reviewer of record and decides on scope. Concretely:

- History entries are appended by `matrix:supersede` only; an existing entry is never edited or
  removed.
- A Criterion's `id`, `clause`, `paraphrase` and `applicability` change only in Extract, with a new
  `edition`; Assess and Re-validate write the `assessment` block only.
- A Gap issue closes through a merged PR, never by the agent directly.
- A new text enters `sources.yaml` only by the disposition rule of the watch or a map decision.
- The workflow `conformance-validation-run.yml` reports and requests; every matrix write comes
  from a local session behind a PR.
