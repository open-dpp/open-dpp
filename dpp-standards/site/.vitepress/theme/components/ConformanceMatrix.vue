<script setup lang="ts">
/** One page per matrix file: header with edition and source link, then the clause walk. */
import { computed } from "vue";
import { data } from "../../matrix.data";
import ClauseWalk from "./ClauseWalk.vue";
import { TIER_LABEL } from "./shared";

const props = defineProps<{ standard: string }>();
const standard = computed(() => data.standards.find((s) => s.standard === props.standard));
</script>

<template>
  <div v-if="standard" class="cm-matrix">
    <header class="cm-head">
      <p class="cm-kicker">Conformance Matrix · {{ TIER_LABEL[standard.source.tier] }}</p>
      <h1>{{ standard.source.reference }}</h1>
      <p class="cm-muted">
        {{ standard.source.title }} · edition <code>{{ standard.edition }}</code> ·
        <a :href="standard.source.url" target="_blank" rel="noreferrer">source text</a> · file
        <code>{{ standard.file }}</code>
      </p>
    </header>
    <ClauseWalk :standard="standard" />
  </div>
  <p v-else>No matrix file for standard {{ props.standard }}.</p>
</template>

<style scoped>
.cm-head {
  margin-bottom: 20px;
}
.cm-kicker {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.cm-head h1 {
  margin: 4px 0 6px;
  font-size: 1.8rem;
  line-height: 1.2;
}
</style>
