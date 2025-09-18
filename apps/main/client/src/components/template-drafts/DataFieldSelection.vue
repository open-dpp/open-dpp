<template>
  <ItemSelection
    :items-to-select="itemsToSelect"
    :parent-granularity-level="props.parentGranularityLevel"
    :parent-id="props.parentId"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { DataFieldType, GranularityLevel } from '@open-dpp/api-client';
import {
  ArrowPathIcon,
  ChartBarSquareIcon,
  PaperClipIcon,
} from '@heroicons/vue/24/outline';
import { SidebarContentType } from '../../stores/draftSidebar';
import { LinkIcon } from '@heroicons/vue/16/solid';
import ItemSelection from './ItemSelection.vue';
import { SelectOption } from '../../lib/item-selection';

const props = defineProps<{
  parentId?: string;
  parentGranularityLevel?: GranularityLevel;
}>();

const itemsToSelect = ref<SelectOption[]>([
  {
    title: 'Textfeld',
    description: 'Fügen Sie Textfeld hinzu',
    icon: ArrowPathIcon,
    background: 'bg-pink-500',
    type: DataFieldType.TEXT_FIELD,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    title: 'Produktpass Verlinkung',
    description: 'Fügen Sie eine Verlinkung zu einem Produktpass hinzu',
    icon: LinkIcon,
    background: 'bg-green-500',
    type: DataFieldType.PRODUCT_PASSPORT_LINK,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    title: 'Numerisches Feld',
    description: 'Fügen Sie ein numerisches Feld hinzu',
    icon: ChartBarSquareIcon,
    background: 'bg-teal-500',
    type: DataFieldType.NUMERIC_FIELD,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
  {
    title: 'Datei',
    description: 'Fügen Sie eine Datei hinzu',
    icon: PaperClipIcon,
    background: 'bg-orange-500',
    type: DataFieldType.FILE_FIELD,
    sidebarType: SidebarContentType.DATA_FIELD_FORM,
  },
]);
</script>
