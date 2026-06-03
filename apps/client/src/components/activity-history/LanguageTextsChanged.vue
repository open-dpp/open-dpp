<script setup lang="ts">
import { type LanguageTextChangedDto } from "@open-dpp/dto";
import DiffViewer from "./DiffViewer.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const props = defineProps<{ path: string; values: LanguageTextChangedDto[] }>();
</script>

<template>
  <IdShortPath :path="props.path" />
  <div v-for="(value, index) in props.values" :key="index" class="flex flex-col gap-2">
    <Divider align="center" type="dotted">
      <b>{{ value.lng }} {{ t(`activityHistory.languageOps.${value.op}`) }}</b>
    </Divider>
    <DiffViewer>
      <template v-if="value.oldValue" #oldValue>
        {{ value.oldValue }}
      </template>
      <template v-if="value.newValue" #newValue> {{ value.newValue }} </template>
    </DiffViewer>
  </div>
</template>

<style scoped></style>
