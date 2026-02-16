<script lang="ts" setup>
import type { SharedDppDto } from "@open-dpp/dto";
import type { Page } from "../composables/pagination.ts";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import { Button, Column, DataTable } from "primevue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import TablePagination from "./pagination/TablePagination.vue";

const props = defineProps<{
  title: string;
  items: SharedDppDto[];
  loading: boolean;
  currentPage: Page;
  hasPrevious: boolean;
  hasNext: boolean;
}>();

const emits = defineEmits<{
  (e: "create"): Promise<void>;
  (e: "nextPage"): Promise<void>;
  (e: "previousPage"): Promise<void>;
  (e: "resetCursor"): Promise<void>;
}>();

dayjs.extend(utc);
dayjs.extend(localizedFormat);

const route = useRoute();
const router = useRouter();

async function editItem(id: string) {
  await router.push(`${route.path}/${id}`);
}

function forwardToPresentation(id: string) {
  router.push(`/presentation/${id}`);
}

function forwardToPresentationChat(id: string) {
  router.push(`/presentation/${id}/chat`);
}

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
    <Column>
      <template #body="{ data }">
        <div class="flex w-full justify-end gap-2">
          <div class="flex items-center rounded-md gap-2">
            <Button
              icon="pi pi-pencil"
              severity="primary"
              @click="editItem(data.id)"
            />
          </div>
          <div v-if="data.templateId" class="flex items-center rounded-md gap-2">
            <Button
              icon="pi pi-qrcode"
              severity="primary"
              aria-label="Forward to presentation"
              @click="forwardToPresentation(data.id)"
            />
          </div>
          <div v-if="data.templateId" class="flex items-center rounded-md gap-2">
            <Button
              icon="pi pi-comments"
              severity="primary"
              aria-label="Open presentation chat"
              @click="forwardToPresentationChat(data.id)"
            />
          </div>
        </div>
      </template>
    </Column>
    <template #paginatorcontainer>
      <TablePagination
        :current-page="props.currentPage"
        :has-previous="props.hasPrevious"
        :has-next="props.hasNext"
        @reset-cursor="emits('resetCursor')"
        @previous-page="emits('previousPage')"
        @next-page="emits('nextPage')"
      />
    </template>
  </DataTable>
</template>
