# dpp-standards: the Conformance Review of open-dpp

Everything the Conformance Review produces lives in this folder: the Conformance Matrix (one YAML file
per assessed text), the register of texts, the Validation Run records, the schema and scripts that keep
the files valid, the playbook, the research notes, and a preview site that renders the matrix.
Vocabulary is defined in `CONTEXT.md`, sections "Reviews (shared)" and "Conformance Review"; the plan
is the wayfinder map, issue #749.

Nothing here is part of the product or the public documentation site. Adding pages to `docs/` is a
separate, manual decision taken after the map is finished.

## Layout

| Path                 | What it holds                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `PLAYBOOK.md`        | The three procedures (Extract, Assess, Re-validate), the scope rule, watch, Gap issues, PR. |
| `sources.yaml`       | Register of every assessed text: id, tier, edition, access, where to watch for changes.     |
| `matrix/<ID>.yaml`   | One file per text. Its Criteria and, per Criterion, the **latest** Assessment.              |
| `history/<ID>.yaml`  | Earlier Assessments of that text, moved here by `matrix:supersede`. Append-only.            |
| `runs.yaml`          | One entry per Validation Run: trigger, scope with reasons, commit, validator, reviewer, PR. |
| `watch-state.yaml`   | The acts the Cellar watch query has already returned, each with its disposition.            |
| `research/`          | Research notes of the map's research tickets (source list, capability inventory, criteria). |
| `src/schema.ts`      | Zod schema of sources, matrix and history files, and the assessment rules.                  |
| `src/schema-runs.ts` | Zod schema of `runs.yaml` and `watch-state.yaml`.                                           |
| `src/report.ts`      | Zod schema of the Check report and its fold into a matrix file.                             |
| `src/load.ts`        | Loads, validates and cross-checks all files. Used by the scripts and the site.              |
| `src/mirrors.ts`     | Resolves Mirrors across files (inherited Assessments, counts) and guards `--retire`.        |
| `src/*.spec.ts`      | Tests of the schema, scope rule, Mirrors, history moves, the watch diff and the files.      |
| `site/`              | VitePress preview of the matrix.                                                            |

File ids are the source ids of `sources.yaml` (`ESPR`, `EN18219`, `ISO15459`). The route of a text on
the preview site is its file name in lower case (`/standards/espr`).

## Scripts

All run as `pnpm --filter @open-dpp/dpp-standards <script>`.

| Script                 | What it does                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `matrix:check`         | CI gate: every file valid, cross-references resolve, no pending reviewer of record.                    |
| `matrix:test`          | Tests of the tooling (vitest).                                                                         |
| `matrix:affected`      | Prints the Criteria a trigger touches, with reasons (`--trigger text\|code\|check\|manual …`).         |
| `matrix:run`           | Opens a Validation Run: computes the scope and appends the entry to `runs.yaml` (`--detail`).          |
| `matrix:supersede`     | Moves the latest Assessments of named Criteria to history; `--retire <edition>` marks dropped clauses. |
| `matrix:fold <report>` | Folds `apps/e2e/conformance-report.json` into the matrix files as `check` evidence (never a status).   |
| `matrix:watch`         | Runs the Cellar query and prints the acts `watch-state.yaml` has not seen.                             |
| `matrix:dev`           | Serves the preview site; `matrix:build` builds it.                                                     |

The Checks live in `apps/e2e/tests/conformance/` (Playwright projects `conformance-setup` and
`conformance`, run with `pnpm --filter e2e conformance` against a live Instance). The on-demand
GitHub Actions workflow `conformance-validation-run.yml` runs the matrix check and the watch query and
opens a "Validation Run requested" issue; running the Checks in CI is a follow-up. The same workflow
runs the watch query every Monday and opens or updates one "Standards watch" issue when an act is
unseen by `watch-state.yaml` (a quiet week leaves no issue); GitHub fires the schedule from `main`
only, so it is live once this folder lands there. It never writes a matrix file; the local playbook
does.

## Copyright rule (read before writing a matrix row)

The CEN, ISO and IEC texts are gated and copyrighted. A matrix row **paraphrases** the requirement at
clause level in our own words. Never copy a sentence of a gated text into `paraphrase`, `notes` or an
issue. Short quoted terms are fine; the check rejects any quoted span longer than eight words in a
file whose source is `access: gated`. Gated copies live in the git-ignored `standards/` folder at the
repo root and are never committed. Public texts (EU law, GS1, IDTA, ETSI, ECMA) may be quoted briefly
where precision needs it, but the matrix still paraphrases by default.

## Assessment rules (enforced by the schema where they can be)

- A Criterion is one clause or article paragraph. Its id is `<source id>-<clause>`:
  `ESPR-Art10(1)(c)`, `EN18219-6.2.3`. Ids are unique within a file and never change once written.
  A clause a new edition drops keeps its Criterion with `retiredIn: <edition>`: no Assessment,
  hidden by the renderer, outside every count, its history intact.
- `applicability` classifies who the clause binds: `software` (open-dpp can satisfy or enable it),
  `mixed` (an organisational duty with a software precondition; assessed on the software part),
  `operator` and `commission` (purely organisational; assessed Not applicable by rule).
- A clause that restates a Criterion of **another** text with no delta of any kind is a **Mirror**
  (`CONTEXT.md`): `mirrors: <that criterion id>` and no `assessment`. It shows the target's latest
  Assessment (status, evidence, commit, notes, Gap issue) and is counted apart from the text's own
  Assessments. The schema refuses a Mirror with an `assessment` or one pointing into its own text;
  the loader refuses a target that is unknown, retired, itself a Mirror, or bound to another actor
  (`applicability` differs). Any delta (actors, granularity, retention, fixed values, replaced or
  added documents) makes the clause an own Criterion, which may name the related id in its
  paraphrase or notes. One target per Mirror. Checks tag the target, never a Mirror;
  `matrix:supersede` moves nothing for a Mirror and refuses to retire a Criterion another text still
  mirrors. The scope rule is in `PLAYBOOK.md`, section "Scope".
- `status` is `Met`, `Partial`, `Gap` or `Not applicable`. A Criterion without an `assessment` renders
  as **Not assessed**. Counts are per text, own Assessments and inherited statuses (Mirrors) apart;
  there is no overall percentage anywhere, by design.
- **Met** needs `code` evidence **and** one of `test`, `check` or dated `manual` evidence. If the
  requirement is operational (`operational: true`), it also needs `doc` evidence (operator docs).
  `check` evidence carries the Check id, `result` (`passed` or `failed`) and `date` of the last fold;
  Met with a failed check is invalid until the Criterion is re-assessed.
- **Partial** and **Gap** need `gapIssue`: the number of the `conformance` issue tracking the Gap.
  One issue per Gap cluster (the feature whose delivery closes the Gaps), titled
  `[<primary criterion id>] …`, listing every Criterion it tracks; several Criteria share a number.
  Link an existing issue instead of opening a duplicate.
- **Not applicable** needs `notes` giving the reason.
- Every Assessment records `date`, `commit` (on `main`), `validator` (`agent:conformance-review`
  for a playbook run, a person's name otherwise) and the text `edition` is on the file. Evidence
  `ref` is a repo path for `code`, `test` and `doc`, a check id for `check`, and a description for
  `manual`.

## Validation Runs and history

A Validation Run is one pass of the playbook (Assess or Re-validate) against one commit of `main`,
over a computed scope. `matrix:run` writes its entry to `runs.yaml` with `validator:
agent:conformance-review` and `reviewer: pending`; `matrix:check` refuses a pending reviewer, so the
run's PR stays red until the reviewer of record replaces `pending` with their name as the last
step of review. That edit is the human approval of every status in the run.

A re-validation moves the previous Assessment of each Criterion in scope, with the criterion id, to
`history/<ID>.yaml` (`matrix:supersede`, which creates the file on first use), then writes the new
`assessment`. The matrix file therefore always holds exactly the latest Assessment and stays small
enough for one agent session to read; the trend of a Criterion is the history file plus git. History
entries are never edited or deleted.

## Preview site

`pnpm --filter @open-dpp/dpp-standards matrix:dev` serves four kinds of page: an overview with the
per-text counts, the standards watch rendered from `sources.yaml`, the Validation Runs from
`runs.yaml`, and one page per matrix file. The per-text page is a **clause walk**: it reads like the
text itself, section by section, with a sticky section nav whose bars show the status mix, one block
per Criterion (id, clause, applicability, the ENs that operationalise it, status, paraphrase) and,
once assessed, the evidence pinned to the assessed commit, the Gap issue and the earlier Assessments
from the history file. A Mirror row shows the inherited Assessment with an "inherited from" marker
linking to the target's row, and the nav counts the text's Mirrors apart from its own Assessments;
the overview shows inherited statuses as a muted `+n`. Operator and Commission duties are hidden
behind a toggle; retired Criteria are hidden. This design was chosen in ticket #753 (2026-09-05) over a filterable register table and
a per-status board; both rejected variants live on the branch `prototype/conformance-matrix-753`,
which is never merged.

## Adding a text

Procedure Extract in `PLAYBOOK.md`: register it in `sources.yaml`, create `matrix/<ID>.yaml` with
every Criterion unassessed, run the check. The preview site picks the file up automatically.
