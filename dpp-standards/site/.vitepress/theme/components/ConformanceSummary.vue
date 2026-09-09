<script setup lang="ts">
import { withBase } from "vitepress";
import type { StandardMatrix } from "../../../../src/load";
import { data } from "../../matrix.data";
import StatusBadge from "./StatusBadge.vue";
import { fillClass, STATUS_ORDER, TIER_LABEL } from "./shared";

const standards = data.standards;
const withMatrix = new Set(standards.map((s) => s.standard));
const pending = data.sources.filter((s) => !withMatrix.has(s.id));
/** Active Mirrors of a text: rows that inherit another text's Assessment. */
const mirrorsOf = (s: StandardMatrix): number =>
  STATUS_ORDER.reduce((n, status) => n + s.inheritedCounts[status], 0);
const ownOf = (s: StandardMatrix): number => s.criteria.length - s.retired - mirrorsOf(s);
</script>

<template>
  <p class="cm-muted">
    Counts are per text and there is no overall percentage, by design: the texts differ in size and
    legal weight. A muted <code>+n</code> counts the text's Mirrors that inherit that status from
    another text; they are not own Assessments. Each row links to the text's matrix.
  </p>
  <table class="cm-table cm-summary">
    <thead>
      <tr>
        <th>Text</th>
        <th>Edition assessed</th>
        <th class="num">Criteria</th>
        <th v-for="s in STATUS_ORDER" :key="s" class="num"><StatusBadge :status="s" compact /></th>
        <th>Last assessed</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="s in standards" :key="s.standard">
        <td>
          <a :href="withBase(`/standards/${s.slug}`)"
            ><strong>{{ s.source.reference }}</strong></a
          >
          <br />
          <span class="cm-muted">{{ s.source.title }} · {{ TIER_LABEL[s.source.tier] }}</span>
          <div class="cm-bar">
            <span
              v-for="st in STATUS_ORDER"
              :key="st"
              :class="fillClass(st)"
              :style="{ flexGrow: s.counts[st] }"
              :title="`${st}: ${s.counts[st]}`"
            ></span>
          </div>
        </td>
        <td>
          <code>{{ s.edition }}</code>
        </td>
        <td class="num">
          {{ ownOf(s) }}<template v-if="mirrorsOf(s)"
            ><br /><span class="cm-muted">+{{ mirrorsOf(s) }} Mirrors</span></template
          >
        </td>
        <td v-for="st in STATUS_ORDER" :key="st" class="num">
          {{ s.counts[st] || "·"
          }}<span v-if="s.inheritedCounts[st]" class="cm-muted"> +{{ s.inheritedCounts[st] }}</span>
        </td>
        <td>{{ s.lastAssessed ?? "never" }}</td>
      </tr>
    </tbody>
  </table>

  <h2>Registered texts without a matrix yet</h2>
  <p class="cm-muted">
    Listed in <code>sources.yaml</code>; their assessment tickets are on the map.
  </p>
  <ul class="cm-pending">
    <li v-for="p in pending" :key="p.id">
      <strong>{{ p.reference }}</strong>
      <span class="cm-muted cm-after"
        >{{ p.title }} · {{ TIER_LABEL[p.tier] }} · {{ p.access }}</span
      >
    </li>
  </ul>
</template>

<style scoped>
.cm-summary td:first-child {
  min-width: 260px;
}
</style>
