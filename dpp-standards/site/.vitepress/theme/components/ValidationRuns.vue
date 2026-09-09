<script setup lang="ts">
/** Every Validation Run of runs.yaml, newest first, with its scope, commit, validator and reviewer. */
import { reasonKey } from "../../../../src/reasons";
import { data } from "../../matrix.data";
import { commitUrl, issueUrl, REPO } from "./shared";

const runs = [...data.runs].reverse();
const prUrl = (n: number): string => `${REPO}/pull/${n}`;
const reasons = (run: (typeof runs)[number]): string =>
  Object.entries(
    run.scope.reduce<Record<string, number>>(
      (acc, e) => ({ ...acc, [reasonKey(e.reason)]: (acc[reasonKey(e.reason)] ?? 0) + 1 }),
      {},
    ),
  )
    .map(([reason, count]) => `${count} ${reason}`)
    .join(", ");
</script>

<template>
  <p v-if="runs.length === 0" class="cm-muted">No Validation Run recorded yet.</p>
  <table v-else class="cm-table">
    <thead>
      <tr>
        <th>Run</th>
        <th>Trigger</th>
        <th>Scope</th>
        <th>Commit</th>
        <th>Validator</th>
        <th>Reviewer of record</th>
        <th>Links</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="run in runs" :key="run.id">
        <td>
          <code>{{ run.id }}</code
          ><br /><span class="cm-muted">{{ run.date }}</span>
        </td>
        <td>
          <span class="cm-tag">{{ run.trigger.kind }}</span> {{ run.trigger.detail }}
        </td>
        <td>
          {{ run.sources.join(", ") }}<br />
          <span class="cm-muted">{{ run.scope.length }} criteria: {{ reasons(run) }}</span>
        </td>
        <td>
          <a :href="commitUrl(run.commit)" target="_blank" rel="noreferrer"
            ><code>{{ run.commit.slice(0, 8) }}</code></a
          >
        </td>
        <td>{{ run.validator }}</td>
        <td>
          <span v-if="run.reviewer === 'pending'" class="cm-tag">pending</span>
          <template v-else>{{ run.reviewer }}</template>
        </td>
        <td>
          <a v-if="run.pr" :href="prUrl(run.pr)" target="_blank" rel="noreferrer"
            >PR #{{ run.pr }}</a
          >
          <span v-if="run.pr && run.requestedBy"> · </span>
          <a
            v-if="run.requestedBy"
            :href="issueUrl(run.requestedBy)"
            target="_blank"
            rel="noreferrer"
            >request #{{ run.requestedBy }}</a
          >
          <span v-if="run.adversarialReview" class="cm-muted">
            · {{ run.adversarialReview.blockingObjections }} blocking objection(s)</span
          >
        </td>
      </tr>
    </tbody>
  </table>
</template>
