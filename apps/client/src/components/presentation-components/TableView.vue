<script setup lang="ts">
import type { DataSectionDto } from "@open-dpp/api-client";
import { Button, Column, DataTable } from "primevue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useProductPassportStore } from "../../stores/product-passport";
import DataValue from "./DataValue.vue";

const props = defineProps<{ dataSection: DataSectionDto }>();
const router = useRouter();
const productPassportStore = useProductPassportStore();
const subSections = computed(() =>
  productPassportStore.findSubSections(props.dataSection.id),
);
const { t } = useI18n();
const headers = computed(() => {
  const headers = props.dataSection.dataFields.map(d => d.name);
  if (subSections.value && subSections.value.length > 0) {
    headers.push("Weiterführende Abschnitte");
  }
  return headers;
});

async function onSubSectionClick(subSectionId: string, rowIndex: number) {
  await router.push(
    `?sectionId=${subSectionId}&row=${rowIndex}&parentSectionId=${props.dataSection.id}`,
  );
}

function generateHeaderClasses(index: number) {
  return index === 0
    ? "py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0"
    : "hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell";
}

function generateCellClasses(index: number) {
  return index === 0
    ? "px-3 py-4 text-sm text-gray-500 table-cell"
    : "hidden px-3 py-4 text-sm text-gray-500 lg:table-cell";
}
</script>

<template>
  <div class="-mx-4 mt-8 sm:-mx-0">
    <DataTable :value="dataSection.dataValues" table-style="min-width: 50rem">
      <Column>
        <template #body="{ index }">
          <Button v-slot="slotProps" as-child aria-label="Search">
            <RouterLink :to="`?sectionId=${dataSection.id}&row=${index}&parentSectionId=${dataSection.id}`" :class="slotProps.class">
              {{ t('presentation.moreInfo') }}
            </RouterLink>
          </Button>
        </template>
      </Column>
      <Column v-for="(dataField) in dataSection.dataFields" :key="dataField.id" :field="dataField.name" :header="dataField.name">
        <template #body="slotProps">
          <DataValue
            :field-view="{
              dataField,
              value: slotProps.data[dataField.id],
            }"
          />
        </template>
      </Column>
    </DataTable>
    <table class="min-w-full divide-y divide-gray-300">
      <thead>
        <tr>
          <th
            v-for="(name, index) in headers"
            :key="index"
            scope="col"
            :class="[generateHeaderClasses(index)]"
          >
            {{ name }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        <tr
          v-for="(dataValuesOfRow, rowIndex) in dataSection.dataValues"
          :key="rowIndex"
        >
          <td
            v-for="(dataValue, id, colIndex) in dataValuesOfRow"
            :key="id"
            :class="[generateCellClasses(colIndex)]"
          >
            <DataValue
              :field-view="{
                dataField: dataSection.dataFields.find((d) => d.id === id)!,
                value: dataValue,
              }"
            />
          </td>
          <td
            v-if="subSections && subSections.length > 0"
            :class="[
              generateCellClasses(Object.entries(dataValuesOfRow).length),
            ]"
          >
            <div class="grid grid-cols-2 gap-1">
              <button
                v-for="subSection in subSections"
                :key="subSection.id"
                :data-cy="`${subSection.id}_${rowIndex}`"
                class="cursor-pointer p-1 block rounded-md text-center font-semibold shadow-xs focus-visible:outline focus-visible:outline-offset-2 bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600 text-white"
                @click="onSubSectionClick(subSection.id, rowIndex)"
              >
                {{ subSection.name }}
              </button>
            </div>
          </td>
          <td class="py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-0">
            <router-link
              class="text-indigo-600 hover:text-indigo-900"
              :data-cy="`${dataSection.id}_${rowIndex}`"
              :to="`?sectionId=${dataSection.id}&row=${rowIndex}&parentSectionId=${dataSection.id}`"
            >
              Mehr Infos
            </router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
