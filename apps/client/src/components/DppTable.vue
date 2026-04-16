<script lang="ts" setup>
import type { DppStatusDtoType, SharedDppDto } from "@open-dpp/dto";
import type { Page } from "../composables/pagination.ts";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAasUtils } from "../composables/aas-utils.ts";

import { convertLocaleToLanguage } from "../translations/i18n.ts";
import TablePagination from "./pagination/TablePagination.vue";
import DppStatusSelect from "./dpp/DppStatusSelect.vue";

const props = defineProps<{
  title: string;
  items: SharedDppDto[];
  loading: boolean;
  currentPage: Page;
  hasPrevious: boolean;
  hasNext: boolean;
}>();

const selectedStatus = defineModel<DppStatusDtoType>("selectedStatus");

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
const { t, locale } = useI18n();
const selectedLanguage = computed(() => convertLocaleToLanguage(locale.value));
const { parseDisplayNameFromEnvironment } = useAasUtils({
  translate: t,
  selectedLanguage: selectedLanguage.value,
});

async function editItem(item: SharedDppDto) {
  await router.push(`${route.path}/${item.id}`);
}
</script>

<template>
  <DataTable
    :value="props.items"
    :loading="props.loading"
    table-style="min-width: 50rem"
    paginator
    :rows="10"
    :rows-per-page-options="[10]"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-xl font-bold">{{ props.title }} with status</span>
          <DppStatusSelect v-model="selectedStatus" />
        </div>
        <div class="flex items-center gap-2">
          <slot name="headerActions">
            <Button :label="t('common.add')" @click="emits('create')" />
          </slot>
        </div>
      </div>
    </template>
    <Column field="id" header="Id" />
    <Column field="environment" header="Name">
      <template #body="slotProps">
        <p>
          {{ parseDisplayNameFromEnvironment(slotProps.data.environment) }}
        </p>
      </template>
    </Column>
    <Column field="lastStatusChange" header="Status">
      <template #body="slotProps">
        <p>
          {{ slotProps.data.lastStatusChange.currentStatus }}
        </p>
      </template>
    </Column>
    <Column :header="t('templates.createdAt')">
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.createdAt).format("LLL") }}
        </p>
      </template>
    </Column>
    <Column :header="t('templates.updatedAt')">
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.updatedAt).format("LLL") }}
        </p>
      </template>
    </Column>
    <Column>
      <template #body="{ data }">
        <div class="flex w-full justify-end gap-2">
          <slot name="actions" :passport="data" :edit-item="editItem">
            <Button
              icon="pi pi-pencil"
              severity="primary"
              :aria-label="t('common.edit')"
              :title="t('common.edit')"
              @click="editItem(data)"
            />
          </slot>
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
