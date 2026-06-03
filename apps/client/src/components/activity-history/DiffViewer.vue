<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<template>
  <dl>
    <div v-if="$slots.oldValue">
      <dt class="text-sm/6 font-medium text-gray-900">{{ t("activityHistory.oldValue") }}</dt>
      <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0"><slot name="oldValue" /></dd>
    </div>
    <div v-if="$slots.newValue">
      <dt class="text-sm/6 font-medium text-gray-900">{{ t("activityHistory.newValue") }}</dt>
      <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0"><slot name="newValue" /></dd>
    </div>
  </dl>
</template>

<style scoped></style>
