<script lang="ts" setup>
import type { SharedDppDto } from "@open-dpp/dto";
import type { Page } from "../stores/pagination.ts";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import { Button, Column, DataTable } from "primevue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  title: string;
  items: SharedDppDto[];
  loading: boolean;
  currentPage: Page;
}>();

const emits = defineEmits<{
  (e: "create"): Promise<void>;
  (e: "nextPage"): Promise<void>;
  (e: "previousPage"): Promise<void>;
}>();

dayjs.extend(utc);
dayjs.extend(localizedFormat);

const { t } = useI18n();
</script>

<template>
  <DataTable
    :value="props.items" :loading="props.loading" table-style="min-width: 50rem"
    paginator :rows="10" :rows-per-page-options="[10]"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ props.title }}</span>
        <Button :label="t('common.add')" @click="emits('create')" />
      </div>
    </template>
    <Column field="id" header="Id" />
    <Column :header="t('templates.createdAt')">
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.createdAt).format('LLL') }}
        </p>
      </template>
    </Column>
    <Column :header="t('templates.updatedAt')">
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.updatedAt).format('LLL') }}
        </p>
      </template>
    </Column>
    <template #paginatorcontainer>
      <div class="flex items-center gap-4 border border-primary bg-transparent rounded-full w-full py-1 px-2 justify-between">
        <Button icon="pi pi-chevron-left" rounded text :disabled="!currentPage.cursor" @click="emits('previousPage')" />
        <div class="text-color font-medium">
          <span class="hidden sm:block">Showing: {{ currentPage.from + 1 }} to {{ currentPage.to + 1 }}, Count: {{ currentPage.itemCount }}</span>
        </div>
        <Button icon="pi pi-chevron-right" rounded text :disabled="currentPage.itemCount < currentPage.to - currentPage.from" @click="emits('nextPage')" />
      </div>
    </template>
  </DataTable>
</template>
