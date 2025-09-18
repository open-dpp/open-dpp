<template>
  <div>
    <DraftDataFieldGeneric
      v-if="
        [
          DataFieldType.TEXT_FIELD,
          DataFieldType.PRODUCT_PASSPORT_LINK,
          DataFieldType.NUMERIC_FIELD,
          DataFieldType.FILE_FIELD,
        ].includes(props.dataField.type)
      "
      :data-field="props.dataField"
      :section="props.section"
      @clicked="onClicked"
    />
    <DraftDataFieldUnsupported v-else :data-field="props.dataField" />
  </div>
</template>

<script lang="ts" setup>
import { DataFieldDto, DataFieldType, SectionDto } from '@open-dpp/api-client';
import {
  SidebarContentType,
  useDraftSidebarStore,
} from '../../stores/draftSidebar';
import DraftDataFieldUnsupported from './draft-data-field-types/DraftDataFieldUnsupported.vue';
import DraftDataFieldGeneric from './draft-data-field-types/DraftDataFieldGeneric.vue';

const props = defineProps<{ dataField: DataFieldDto; section: SectionDto }>();

const draftSidebarStore = useDraftSidebarStore();

const onClicked = () => {
  draftSidebarStore.open(SidebarContentType.DATA_FIELD_FORM, {
    type: props.dataField.type,
    id: props.dataField.id,
  });
};
</script>
