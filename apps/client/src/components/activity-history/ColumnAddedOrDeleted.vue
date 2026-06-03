<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { SubmodelElementResponseDto } from "@open-dpp/dto";
import { useAasUtils } from "../../composables/aas-utils.ts";

const props = defineProps<{
  position: number;
  value: SubmodelElementResponseDto;
}>();
const { parseLanguageTexts } = useAasUtils();
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col gap-2">
    <dl>
      <div>
        <dt class="text-sm/6 font-medium text-gray-900">{{ t("activityHistory.position") }}</dt>
        <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">{{ props.position + 1 }}</dd>
      </div>
      <div v-if="props.value.displayName">
        <dt class="text-sm/6 font-medium text-gray-900">{{ t("activityHistory.name") }}</dt>
        <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
          {{ parseLanguageTexts(props.value.displayName, props.value.idShort) }}
        </dd>
      </div>
    </dl>
  </div>
</template>
