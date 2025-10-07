<script lang="ts" setup>
import type { GranularityLevel } from "@open-dpp/api-client";
import {
  SidebarContentType,
  useDraftSidebarStore,
} from "../../stores/draftSidebar";
import BaseButton from "../BaseButton.vue";

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
}>();

const { t } = useI18n();
const draftSidebarStore = useDraftSidebarStore();

function open() {
  draftSidebarStore.open(SidebarContentType.SECTION_SELECTION, {
    parentId: props.parentId,
    parentGranularityLevel: props.parentGranularityLevel,
  });
}
</script>

<template>
  <BaseButton type="button" variant="primary" @click="open">
    {{ t('draft.addSection') }}
  </BaseButton>
</template>
