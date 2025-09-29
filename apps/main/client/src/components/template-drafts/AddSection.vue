<template>
  <BaseButton @click="open" type="button" variant="primary">
    {{ t('draft.addSection') }}
  </BaseButton>
</template>

<script lang="ts" setup>
import {
  SidebarContentType,
  useDraftSidebarStore,
} from '../../stores/draftSidebar';
import { GranularityLevel } from '@open-dpp/api-client';
import BaseButton from '../BaseButton.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
}>();

const open = () => {
  draftSidebarStore.open(SidebarContentType.SECTION_SELECTION, {
    parentId: props.parentId,
    parentGranularityLevel: props.parentGranularityLevel,
  });
};

const draftSidebarStore = useDraftSidebarStore();
</script>
