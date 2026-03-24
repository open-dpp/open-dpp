<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import NavigationTree from "./NavigationTree.vue";

const visible = defineModel<boolean>({ required: true });

const { t } = useI18n();

function onNavigate() {
  visible.value = false;
}
</script>

<template>
  <Drawer
    v-model:visible="visible"
    position="left"
    :header="t('presentation.navigation')"
  >
    <NavigationTree @navigate="onNavigate" />
  </Drawer>
</template>
