<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  submodelId: string;
  oldPosition: number;
  position: number;
}>();
const { t } = useI18n();
</script>

<template>
  <dl>
    <DescriptionTerm dt="ID">
      {{ props.submodelId }}
    </DescriptionTerm>
    <DescriptionTerm :dt="t('activityHistory.oldPosition')">
      {{ props.oldPosition + 1 }}
    </DescriptionTerm>
    <DescriptionTerm :dt="t('activityHistory.position')">
      {{ props.position + 1 }}
    </DescriptionTerm>
  </dl>
</template>
