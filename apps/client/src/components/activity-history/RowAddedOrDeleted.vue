<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import SubmodelElementName from "./SubmodelElementName.vue";

const props = defineProps<{
  position: number;
  value: SubmodelElementResponseDto;
}>();
const { t } = useI18n();
</script>

<template>
  <dl>
    <DescriptionTerm :dt="t('activityHistory.position')">
      {{ props.position + 1 }}
    </DescriptionTerm>
    <SubmodelElementName :value="props.value" />
  </dl>
</template>
