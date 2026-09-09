<script setup lang="ts">
/**
 * The per-standard page: reads like the standard, section by section, with a sticky section nav.
 * Chosen in wayfinder ticket #753 over a register table and a status board (branch
 * prototype/conformance-matrix-753 keeps both).
 */
import { withBase } from "vitepress";
import { computed, ref } from "vue";
import type { StandardMatrix } from "../../../../src/load";
import type { Criterion } from "../../../../src/schema";
import CriterionDetail from "./CriterionDetail.vue";
import StatusBadge from "./StatusBadge.vue";
import {
  activeCriteria,
  APPLICABILITY_LABEL,
  countBy,
  criterionPath,
  fillClass,
  historyOf,
  isOrganisational,
  mirrorCriteria,
  ownCriteria,
  statusOf,
} from "./shared";

const props = defineProps<{ standard: StandardMatrix }>();
const showOrganisational = ref(false);
const inherited = computed(() => props.standard.inherited);

const sections = computed(() =>
  props.standard.sections.map((sec) => {
    const inSection = props.standard.criteria.filter((c) => c.section === sec.id);
    const all = activeCriteria(inSection);
    const visible = showOrganisational.value ? all : all.filter((c) => !isOrganisational(c));
    return {
      ...sec,
      all,
      visible,
      hidden: all.length - visible.length,
      retired: inSection.length - all.length,
      counts: countBy(all, inherited.value),
    };
  }),
);
/** Own Assessments and the statuses the text's Mirrors inherit, shown apart. */
const total = computed(() => countBy(ownCriteria(props.standard.criteria)));
const mirrors = computed(() => mirrorCriteria(props.standard.criteria));
const inheritedTotal = computed(() => countBy(mirrors.value, inherited.value));
const organisationalTotal = computed(() => props.standard.criteria.filter(isOrganisational).length);
const hasDetail = (c: Criterion): boolean =>
  c.assessment !== undefined || c.mirrors !== undefined || historyOf(props.standard, c.id).length > 0;
const targetUrl = (c: Criterion): string =>
  withBase(criterionPath(c.mirrors ?? "", inherited.value[c.id]?.slug));
</script>

<template>
  <div class="cm-walk">
    <aside class="cm-walk-nav">
      <div class="cm-stamp">
        <div>
          <span class="cm-muted">Edition</span><br /><code>{{ standard.edition }}</code>
        </div>
        <div>
          <span class="cm-muted">Last assessed</span><br />{{ standard.lastAssessed ?? "never" }}
        </div>
        <div class="cm-stamp-counts">
          <span v-for="{ status, count } in total" :key="status">
            <StatusBadge :status="status" compact /> <span class="num">{{ count }}</span>
          </span>
        </div>
        <div v-if="mirrors.length">
          <span class="cm-muted">{{ mirrors.length }} Mirrors inherit</span>
          <div class="cm-stamp-counts">
            <span v-for="{ status, count } in inheritedTotal" :key="status">
              <StatusBadge :status="status" compact /> <span class="num">{{ count }}</span>
            </span>
          </div>
        </div>
      </div>
      <nav>
        <a v-for="sec in sections" :key="sec.id" :href="`#sec-${sec.id}`" class="cm-walk-link">
          <span class="cm-walk-link-title">{{ sec.title }}</span>
          <span class="cm-bar">
            <span
              v-for="{ status, count } in sec.counts"
              :key="status"
              :class="fillClass(status)"
              :style="{ flexGrow: count }"
            ></span>
          </span>
        </a>
      </nav>
      <label class="cm-toggle">
        <input v-model="showOrganisational" type="checkbox" />
        Show the {{ organisationalTotal }} operator and Commission duties
      </label>
    </aside>

    <div class="cm-walk-body">
      <section v-for="sec in sections" :id="`sec-${sec.id}`" :key="sec.id" class="cm-walk-section">
        <h2>
          {{ sec.title }}
          <span class="cm-muted">
            {{ sec.all.length }} criteria<template v-if="sec.hidden">
              · {{ sec.hidden }} hidden</template
            ><template v-if="sec.retired"> · {{ sec.retired }} retired</template>
          </span>
        </h2>
        <article
          v-for="c in sec.visible"
          :id="c.id"
          :key="c.id"
          class="cm-walk-item"
          :class="{ dim: isOrganisational(c) }"
        >
          <div class="cm-walk-item-head">
            <code class="cm-id">{{ c.id }}</code>
            <span class="cm-muted">{{ c.clause }}</span>
            <span class="cm-tag">{{ APPLICABILITY_LABEL[c.applicability] }}</span>
            <span v-for="id in c.operationalisedBy" :key="id" class="cm-chip">{{
              id.replace(/^EN/, "EN ")
            }}</span>
            <a
              v-if="c.mirrors"
              class="cm-chip cm-mirror"
              :href="targetUrl(c)"
              :title="`Mirror: shows the latest Assessment of ${c.mirrors}`"
              >inherited from {{ c.mirrors }}</a
            >
            <StatusBadge :status="statusOf(c, inherited)" class="cm-walk-status" />
          </div>
          <p class="cm-walk-paraphrase">{{ c.paraphrase }}</p>
          <CriterionDetail
            v-if="hasDetail(c)"
            :criterion="c"
            :standard="standard"
            :show-paraphrase="false"
            :show-meta="false"
          />
        </article>
      </section>
    </div>
  </div>
</template>

<style scoped>
.cm-walk {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 32px;
  align-items: start;
}
.cm-walk-nav {
  position: sticky;
  top: calc(var(--vp-nav-height) + 16px);
  font-size: 0.82rem;
}
.cm-stamp {
  display: grid;
  gap: 8px;
  padding: 12px;
  margin-bottom: 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}
.cm-stamp-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
}
.cm-walk-link {
  display: block;
  padding: 6px 8px;
  border-radius: 6px;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.cm-walk-link:hover {
  background: var(--vp-c-bg-soft);
}
.cm-walk-link-title {
  display: block;
  line-height: 1.3;
}
.cm-toggle {
  display: block;
  margin-top: 14px;
  padding: 0 8px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}
.cm-walk-section h2 {
  margin-top: 32px;
  font-size: 1.2rem;
}
.cm-walk-section h2 .cm-muted {
  font-weight: 400;
  margin-left: 8px;
}
.cm-walk-item {
  padding: 12px 0 14px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.cm-walk-item-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.cm-walk-status {
  margin-left: auto;
}
.cm-walk-paraphrase {
  margin: 6px 0 8px;
  line-height: 1.55;
}
@media (max-width: 900px) {
  .cm-walk {
    grid-template-columns: 1fr;
  }
  .cm-walk-nav {
    position: static;
  }
}
</style>
