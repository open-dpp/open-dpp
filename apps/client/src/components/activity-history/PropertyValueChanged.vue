<script setup lang="ts">
import { formatPropertyValue } from "../../lib/property-value.ts";
import { ChangeEventDtoTypes, type DataTypeDefType } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import DiffViewer from "./DiffViewer.vue";

const { locale } = useI18n();

const props = defineProps<{
  valueType: DataTypeDefType;
  oldValue: string | null;
  newValue: string | null;
}>();

const language = computed(() => convertLocaleToLanguage(locale.value));
</script>

<template>
  <DiffViewer>
    <template #oldValue>
      {{ formatPropertyValue(props.oldValue, props.valueType, language) }}
    </template>
    <template #newValue>
      {{ formatPropertyValue(props.newValue, props.valueType, language) }}
    </template>
  </DiffViewer>
</template>

<style scoped></style>
