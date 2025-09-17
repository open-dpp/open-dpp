<template>
  <div class="-mx-4 mt-8 sm:-mx-0">
    <table class="min-w-full divide-y divide-gray-300">
      <thead>
        <tr>
          <th
            v-for="(name, index) in headers"
            scope="col"
            :key="index"
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
                :data-cy="`${subSection.id}_${rowIndex}`"
                v-for="subSection in subSections"
                @click="onSubSectionClick(subSection.id, rowIndex)"
                :key="subSection.id"
                class="cursor-pointer p-1 block rounded-md text-center font-semibold shadow-xs focus-visible:outline focus-visible:outline-offset-2 bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600 text-white"
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
              >Mehr Infos</router-link
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import { DataSectionDto } from "@open-dpp/api-client";
import DataValue from "./DataValue.vue";
import { computed } from "vue";
import { useProductPassportStore } from "../stores/product-passport";
import { useRouter } from "vue-router";

const router = useRouter();
const props = defineProps<{ dataSection: DataSectionDto }>();
const productPassportStore = useProductPassportStore();
const subSections = computed(() =>
  productPassportStore.findSubSections(props.dataSection.id),
);
const headers = computed(() => {
  const headers = props.dataSection.dataFields.map((d) => d.name);
  if (subSections.value && subSections.value.length > 0) {
    headers.push("Weiterführende Abschnitte");
  }
  return headers;
});

const onSubSectionClick = async (subSectionId: string, rowIndex: number) => {
  await router.push(
    `?sectionId=${subSectionId}&row=${rowIndex}&parentSectionId=${props.dataSection.id}`,
  );
};

const generateHeaderClasses = (index: number) => {
  return index === 0
    ? "py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0"
    : "hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell";
};

const generateCellClasses = (index: number) => {
  return index === 0
    ? "px-3 py-4 text-sm text-gray-500 table-cell"
    : "hidden px-3 py-4 text-sm text-gray-500 lg:table-cell";
};
</script>
