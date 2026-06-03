<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps<{
  position: number;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-2">
    <div>
      <span class="font-bold">{{ t("activityHistory.position") }}:</span> {{ props.position + 1 }}
    </div>
  </div>
</template>
