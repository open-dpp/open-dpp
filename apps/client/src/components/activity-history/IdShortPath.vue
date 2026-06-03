<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const props = defineProps<{ path: string }>();
</script>

<template>
  <dl>
    <div>
      <dt class="text-sm/6 font-medium text-gray-900">{{ t("activityHistory.path") }}</dt>
      <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{{ props.path }}</dd>
    </div>
  </dl>
</template>

<style scoped></style>
