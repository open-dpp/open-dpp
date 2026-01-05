<script lang="ts" setup>
import type { SharedDppDto } from "@open-dpp/dto";
import { Button, DataTable } from "primevue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  title: string;
  items: SharedDppDto[];
}>();
const emits = defineEmits<{
  (e: "create"): Promise<void>;
}>();
const { t } = useI18n();
</script>

<template>
  <DataTable :value="props.items" table-style="min-width: 50rem">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ props.title }}</span>
        <Button :label="t('common.add')" @click="emits('create')" />
      </div>
    </template>
  </DataTable>
</template>
