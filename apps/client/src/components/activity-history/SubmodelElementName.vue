<script setup lang="ts">
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { useAasUtils } from "../../composables/aas-utils.ts";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  value: SubmodelElementResponseDto;
}>();
const { parseDisplayName } = useAasUtils();
const { t } = useI18n();
</script>

<template>
  <div v-if="props.value.displayName">
    <DescriptionTerm :dt="t('activityHistory.name')">
      {{ parseDisplayName(props.value.displayName) }}
    </DescriptionTerm>
  </div>
</template>
