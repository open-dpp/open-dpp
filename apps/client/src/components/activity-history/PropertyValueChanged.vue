<script setup lang="ts">
import { formatPropertyValue } from "../../lib/property-value.ts";
import type { DataTypeDefType } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { convertLocaleToLanguage } from "../../translations/util.ts";
import DiffViewer from "./DiffViewer.vue";
import IdShortPath from "./IdShortPath.vue";

const { locale } = useI18n();

const props = defineProps<{
  path: string;
  valueType: DataTypeDefType;
  oldValue: string | null;
  newValue: string | null;
}>();
const language = computed(() => convertLocaleToLanguage(locale.value));
</script>

<template>
  <IdShortPath :path="props.path" />
  <DiffViewer>
    <template v-if="props.oldValue" #oldValue>
      {{ formatPropertyValue(props.oldValue, props.valueType, language) }}
    </template>
    <template v-if="props.newValue" #newValue>
      {{ formatPropertyValue(props.newValue, props.valueType, language) }}
    </template>
  </DiffViewer>
</template>

<style scoped></style>
