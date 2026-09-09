<script setup lang="ts">
import { withBase } from "vitepress";
import { data } from "../../matrix.data";
import { TIER_LABEL } from "./shared";

const slugOf = new Map(data.standards.map((s) => [s.standard, s.slug]));
const groups = (["A", "B", "C"] as const).map((tier) => ({
  tier,
  label: TIER_LABEL[tier],
  sources: data.sources.filter((s) => s.tier === tier),
}));
</script>

<template>
  <section v-for="g in groups" :key="g.tier">
    <h2>Tier {{ g.tier }}: {{ g.label }}s</h2>
    <table class="cm-table cm-watch">
      <thead>
        <tr>
          <th>Text</th>
          <th>Edition</th>
          <th>Stage</th>
          <th>Access</th>
          <th>Re-validation trigger</th>
          <th>Matrix</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in g.sources" :key="s.id">
          <td>
            <a :href="s.url" target="_blank" rel="noreferrer"
              ><strong>{{ s.reference }}</strong></a
            >
            <br />
            <span class="cm-muted">{{ s.title }}</span>
            <div v-if="s.citedInOj" class="cm-muted">Cited: {{ s.citedInOj }}</div>
            <div v-if="s.normativeReferences.length" class="cm-muted">
              Normative refs: {{ s.normativeReferences.join(", ") }}
            </div>
          </td>
          <td>{{ s.edition }}</td>
          <td>{{ s.stage }}</td>
          <td>
            <span class="cm-tag" :class="s.access === 'gated' ? 'cm-gated' : 'cm-public'">{{
              s.access
            }}</span>
            <div v-if="s.localFile" class="cm-muted">
              <code>{{ s.localFile }}</code>
            </div>
          </td>
          <td>
            <template v-if="s.watch">
              <a :href="s.watch.url" target="_blank" rel="noreferrer">where to look</a>
              <div class="cm-muted">{{ s.watch.lookFor }}</div>
            </template>
            <span v-else class="cm-muted">none recorded</span>
          </td>
          <td>
            <a v-if="slugOf.get(s.id)" :href="withBase(`/standards/${slugOf.get(s.id)}`)">open</a>
            <span v-else class="cm-muted">not started</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.cm-watch td:first-child {
  min-width: 220px;
}
.cm-gated {
  color: var(--vp-c-red-1);
  background: var(--vp-c-red-soft);
}
.cm-public {
  color: var(--vp-c-green-1);
  background: var(--vp-c-green-soft);
}
</style>
