<script lang="ts" setup>
import { FolderIcon } from "@heroicons/vue/16/solid";
import { useI18n } from "vue-i18n";

const { idShort } = defineProps<{
  idShort: string;
}>();

const { t } = useI18n();
</script>

<template>
  <router-link
    :to="`?submodelid=${idShort}`"
    :data-cy="idShort"
    class="flex gap-2 p-2 border-2 rounded-md hover:bg-gray-50"
  >
    <div class="flex items-center">
      <FolderIcon class="size-5 shrink-0 text-gray-400" aria-hidden="true" />
    </div>
    <span>
      {{ t("presentation.moreInfo") }}
    </span>
  </router-link>
</template>
