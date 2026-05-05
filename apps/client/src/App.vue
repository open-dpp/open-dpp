<script lang="ts" setup>
import Toast from "primevue/toast";
import { computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import SafelistTailwindCss from "./SafelistTailwindCss.vue";

const route = useRoute();

const LayoutDefault = defineAsyncComponent(() => import("./layout/Main.vue"));
const LayoutPresentation = defineAsyncComponent(() => import("./layout/Presentation.vue"));
const LayoutNone = defineAsyncComponent(() => import("./layout/None.vue"));

const layout = computed(() => {
  if (route.meta.layout === "presentation") return LayoutPresentation;
  else if (route.meta.layout === "none") return LayoutNone;
  return LayoutDefault;
});
</script>

<template>
  <SafelistTailwindCss key="safelist" />
  <component :is="layout" key="layout" />
  <Toast />
  <ConfirmDialog />
</template>
