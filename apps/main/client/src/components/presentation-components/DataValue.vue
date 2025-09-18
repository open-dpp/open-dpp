<template>
  <LinkValue
    v-if="
      props.fieldView.dataField.type === DataFieldType.PRODUCT_PASSPORT_LINK
    "
    :field-view="props.fieldView"
  />
  <DataFieldFileValue
    v-else-if="props.fieldView.dataField.type === DataFieldType.FILE_FIELD"
    :field-view="props.fieldView"
  />
  <span v-else>{{ props.fieldView.value }}</span>
</template>

<script setup lang="ts">
import { FieldView } from "../../lib/field-view";
import { DataFieldType } from "@open-dpp/api-client";
import LinkValue from "./LinkValue.vue";
import DataFieldFileValue from "./DataFieldFileValue.vue";

const props = defineProps<{ fieldView: FieldView }>();
</script>
