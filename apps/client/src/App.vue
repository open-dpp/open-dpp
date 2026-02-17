<script lang="ts" setup>
import { computed, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { Toast } from "primevue";
import ModalDialog from "./components/ModalDialog.vue";
import SafelistTailwindCss from "./SafelistTailwindCss.vue";

const route = useRoute();

const LayoutDefault = defineAsyncComponent(
  () => import("./components/layout/Layout.vue"),
);
const LayoutPresentation = defineAsyncComponent(
  () => import("./components/layout/LayoutPresentation.vue"),
);
const LayoutNone = defineAsyncComponent(
  () => import("./components/layout/LayoutNone.vue"),
);

const layout = computed(() => {
  if (route.meta.layout === "presentation")
    return LayoutPresentation;
  else if (route.meta.layout === "none")
    return LayoutNone;
  return LayoutDefault;
});
</script>

<template>
  <SafelistTailwindCss key="safelist" />
  <component :is="layout" key="layout" />
  <ModalDialog key="model-dialog" />
  <Toast />
</template>
