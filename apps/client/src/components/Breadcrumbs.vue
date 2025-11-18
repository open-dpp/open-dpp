<script lang="ts" setup>
import type { RouteRecordRaw } from "vue-router";
import { HomeIcon } from "@heroicons/vue/20/solid";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useLayoutStore } from "../stores/layout";

const { t } = useI18n();
const layoutStore = useLayoutStore();
const route = useRoute();

const lgBreakpoint = 1300;
const isLargeScreen = ref(window.innerWidth > lgBreakpoint);

function updateScreenSize() {
  isLargeScreen.value = window.innerWidth > lgBreakpoint;
}

onMounted(() => {
  window.addEventListener("resize", updateScreenSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScreenSize);
});

const slicedBreadcrumbs = computed(() => {
  return isLargeScreen.value
    ? layoutStore.breadcrumbs.slice(-4)
    : layoutStore.breadcrumbs.slice(-3);
});

function isCurrent(record: RouteRecordRaw) {
  return route.name === record.name;
}
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex">
    <ol
      data-cy="breadcrumb"
      class="flex w-full max-w-(--breakpoint-xl) space-x-4"
      role="list"
    >
      <li class="flex">
        <div class="flex items-center">
          <router-link class="text-gray-400 hover:text-gray-500" to="/">
            <HomeIcon aria-hidden="true" class="h-5 w-5 shrink-0" />
            <span class="sr-only">{{ t('common.home') }}</span>
          </router-link>
        </div>
      </li>
      <li v-for="page in slicedBreadcrumbs" :key="page.name.text" class="flex">
        <div class="flex items-center">
          <svg
            aria-hidden="true"
            class="w-2 h-3 shrink-0 text-gray-200"
            preserveAspectRatio="none"
            viewBox="0 0 24 44"
          >
            <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
          </svg>
          <router-link
            :aria-current="isCurrent(page.route) ? 'page' : undefined"
            :to="{ name: page.route.name, params: page.params }"
            class="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {{ page.name.localized ? t(page.name.text) : page.name.text }}
          </router-link>
        </div>
      </li>
    </ol>
  </nav>
</template>
