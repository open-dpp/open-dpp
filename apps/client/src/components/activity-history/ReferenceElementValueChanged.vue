<script setup lang="ts">
import { formatPropertyValue } from "../../lib/property-value.ts";
import { ChangeEventDtoTypes, type DataTypeDefType, type ReferenceValue } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { convertLocaleToLanguage } from "../../translations/i18n.ts";
import DiffViewer from "./DiffViewer.vue";
import Reference from "../presentation/Reference.vue";

const { locale } = useI18n();

const props = defineProps<{
  oldValue: ReferenceValue;
  newValue: ReferenceValue;
}>();

const language = computed(() => convertLocaleToLanguage(locale.value));
</script>

<template>
  <DiffViewer>
    <template #oldValue>
      <Reference :model="props.oldValue" />
    </template>
    <template #newValue>
      <Reference :model="props.newValue" />
    </template>
  </DiffViewer>
</template>

<style scoped></style>
