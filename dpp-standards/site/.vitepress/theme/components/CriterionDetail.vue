<script setup lang="ts">
import { withBase } from "vitepress";
import { computed } from "vue";
import type { StandardMatrix } from "../../../../src/load";
import type { Criterion } from "../../../../src/schema";
import StatusBadge from "./StatusBadge.vue";
import {
  APPLICABILITY_LABEL,
  AREA_NAMES,
  commitUrl,
  criterionPath,
  historyOf,
  issueUrl,
  manualDate,
  refUrl,
} from "./shared";

const props = withDefaults(
  defineProps<{
    criterion: Criterion;
    standard: StandardMatrix;
    showParaphrase?: boolean;
    showMeta?: boolean;
  }>(),
  { showParaphrase: true, showMeta: true },
);

const history = computed(() => historyOf(props.standard, props.criterion.id));
/** A Mirror shows its target's latest Assessment; the marker links to the target's row. */
const inherited = computed(() => props.standard.inherited[props.criterion.id]);
const assessment = computed(() => props.criterion.assessment ?? inherited.value?.assessment);
const targetUrl = computed(() =>
  withBase(criterionPath(props.criterion.mirrors ?? "", inherited.value?.slug)),
);
const enLabel = (id: string): string => id.replace(/^EN(\d+)$/, "EN $1");
</script>

<template>
  <div class="cm-detail">
    <p v-if="showParaphrase" class="cm-detail-paraphrase">{{ criterion.paraphrase }}</p>

    <dl v-if="showMeta" class="cm-detail-meta">
      <div>
        <dt>Applicability</dt>
        <dd>{{ APPLICABILITY_LABEL[criterion.applicability] }}</dd>
      </div>
      <div v-if="criterion.areas.length">
        <dt>Areas</dt>
        <dd>
          <span v-for="a in criterion.areas" :key="a" class="cm-chip"
            >{{ a }} {{ AREA_NAMES[a] }}</span
          >
        </dd>
      </div>
      <div v-if="criterion.operationalisedBy.length">
        <dt>Operationalised by</dt>
        <dd>{{ criterion.operationalisedBy.map(enLabel).join(", ") }}</dd>
      </div>
      <div v-if="criterion.accessClass">
        <dt>Access class</dt>
        <dd>{{ criterion.accessClass }}</dd>
      </div>
    </dl>

    <section v-if="assessment" class="cm-assessment" :class="{ inherited }">
      <header>
        <StatusBadge :status="assessment.status" />
        <span v-if="inherited" class="cm-chip cm-mirror">
          inherited from
          <a :href="targetUrl"><code>{{ inherited.from }}</code></a>
        </span>
        <span>
          assessed {{ assessment.date }} by {{ assessment.validator }} against
          <a :href="commitUrl(assessment.commit)" target="_blank" rel="noreferrer">
            <code>{{ assessment.commit.slice(0, 8) }}</code>
          </a>
        </span>
        <span v-if="assessment.operational" class="cm-chip">operational requirement</span>
      </header>
      <ul v-if="assessment.evidence.length" class="cm-evidence">
        <li v-for="(e, i) in assessment.evidence" :key="i">
          <span class="cm-evidence-type" :class="`cm-ev-${e.type}`">{{ e.type }}</span>
          <a
            v-if="refUrl(e, assessment.commit)"
            :href="refUrl(e, assessment.commit)"
            target="_blank"
            rel="noreferrer"
          >
            <code>{{ e.ref }}</code>
          </a>
          <code v-else>{{ e.ref }}</code>
          <span v-if="manualDate(e)" class="cm-muted"> on {{ manualDate(e) }}</span>
          <span v-if="e.note" class="cm-muted"> · {{ e.note }}</span>
        </li>
      </ul>
      <p v-else class="cm-muted">No evidence recorded.</p>
      <p v-if="assessment.notes" class="cm-notes">{{ assessment.notes }}</p>
      <p v-if="assessment.gapIssue" class="cm-notes">
        <a :href="issueUrl(assessment.gapIssue)" target="_blank" rel="noreferrer">
          Gap issue #{{ assessment.gapIssue }}
        </a>
      </p>
    </section>
    <p v-else-if="criterion.mirrors" class="cm-muted">
      Not assessed yet: inherits from
      <a :href="targetUrl"><code>{{ criterion.mirrors }}</code></a>, which has no Assessment.
    </p>
    <p v-else class="cm-muted">Not assessed yet.</p>

    <section v-if="history.length" class="cm-history">
      <h4>Earlier assessments</h4>
      <ul>
        <li v-for="h in history" :key="h.date + h.commit">
          <StatusBadge :status="h.status" compact />
          {{ h.date }} · {{ h.validator }} ·
          <a :href="commitUrl(h.commit)" target="_blank" rel="noreferrer"
            ><code>{{ h.commit.slice(0, 8) }}</code></a
          >
          <span v-if="h.gapIssue">
            ·
            <a :href="issueUrl(h.gapIssue)" target="_blank" rel="noreferrer"
              >#{{ h.gapIssue }}</a
            ></span
          >
          <span v-if="h.notes" class="cm-muted"> · {{ h.notes }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
