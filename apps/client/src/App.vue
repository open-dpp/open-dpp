<template>
  <SafelistTailwindCss key="safelist" />
  <component :is="layout" key="layout" />
  <ModalDialog key="model-dialog" />
</template>
<script lang="ts" setup>
import SafelistTailwindCss from './SafelistTailwindCss.vue';
import ModalDialog from './components/ModalDialog.vue';
import { computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const LayoutDefault = defineAsyncComponent(
  () => import('./components/layout/Layout.vue'),
);
const LayoutPresentation = defineAsyncComponent(
  () => import('./components/layout/LayoutPresentation.vue'),
);

const layout = computed(() => {
  if (route.meta.layout === 'presentation') return LayoutPresentation;
  return LayoutDefault;
});
</script>
