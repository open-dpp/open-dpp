---
name: conformance-review
description: Run the Conformance Review playbook (dpp-standards/PLAYBOOK.md). Use when asked to assess or re-validate open-dpp against ESPR, the Batteries Regulation, the DPP registry Regulation or a JTC 24 EN; when a "Validation Run requested" issue is to be resolved; when a standard text got a new edition; or before editing anything under dpp-standards/matrix, runs.yaml or watch-state.yaml.
---

The playbook is the procedure text; this skill only puts you in front of the right part of it.

1. Read `dpp-standards/README.md` (file rules, copyright rule) and `dpp-standards/PLAYBOOK.md`
   in full. Done when you can name the procedure the situation calls for from the playbook's
   "Choose the procedure" table.
2. Complete "Before any procedure". A missing gated text under `standards/` is a stop for the
   Criteria of that source, not for the session.
3. Run that one procedure to its last step, one text per session (Assess) or one trigger per
   session (Re-validate). Load the `research` skill for reading a text in Extract. Reading a gated
   text means paraphrasing at clause level; the check rejects quotes longer than eight words.
4. When the session works a wayfinder ticket of map #749, claim the ticket by assignee first, and
   record the run's PR on the ticket when done.
