<template>
  <div class="mt-6">
    <dl class="grid grid-cols-1 sm:grid-cols-2">
      <DataFieldView
        v-for="dataField in props.dataSection.dataFields"
        :field-view="{
          dataField: dataField,
          value: props.dataSection.dataValues[rowIndex][dataField.id],
        }"
        :key="dataField.id"
      />
    </dl>
    <dl
      v-if="subSections && subSections.length > 0"
      class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 border-t border-gray-100"
    >
      <dt class="text-sm/6 font-medium text-gray-900">
        Weiterführende Abschnitte
      </dt>
      <dd class="mt-2 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        <ul
          role="list"
          class="divide-y divide-gray-100 rounded-md border border-gray-200"
        >
          <li
            class="flex items-center justify-between py-4 pr-5 pl-4 text-sm/6"
            v-for="subSection in subSections"
            :key="subSection.id"
          >
            <div class="flex w-0 flex-1 items-center">
              <FolderIcon
                class="size-5 shrink-0 text-gray-400"
                aria-hidden="true"
              />
              <div class="ml-4 flex min-w-0 flex-1 gap-2">
                <span class="truncate font-medium text-gray-900">{{
                  subSection.name
                }}</span>
              </div>
            </div>
            <div class="ml-4 shrink-0">
              <router-link
                :to="`?sectionId=${subSection.id}&row=${props.rowIndex}&parentSectionId=${dataSection.id}`"
                :data-cy="subSection.id"
                class="font-medium text-indigo-600 hover:text-indigo-500"
                >Mehr Infos</router-link
              >
            </div>
          </li>
        </ul>
      </dd>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { DataSectionDto } from '@open-dpp/api-client';
import DataFieldView from './DataFieldView.vue';
import { FolderIcon } from '@heroicons/vue/16/solid';
import { useProductPassportStore } from '../../stores/product-passport';
import { computed } from 'vue';

const props = defineProps<{
  dataSection: DataSectionDto;
  rowIndex: number;
}>();

const productPassportStore = useProductPassportStore();
const subSections = computed(() =>
  productPassportStore.findSubSections(props.dataSection.id),
);
</script>
