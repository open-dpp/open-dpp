<script setup lang="ts">
import type { FieldView } from "../../lib/field-view";
import { DataFieldType } from "@open-dpp/api-client";
import DataFieldFileValue from "./DataFieldFileValue.vue";
import DataFieldValue from "./DataFieldValue.vue";
import LinkValue from "./LinkValue.vue";

const props = defineProps<{ fieldView: FieldView }>();
</script>

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
  <DataFieldValue v-else :field-view="props.fieldView" />
</template>
