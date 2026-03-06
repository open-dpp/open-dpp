<script setup lang="ts">
import type { DataSectionDto } from "@open-dpp/api-client";
import { Button, Chip, Column, DataTable } from "primevue";
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

async function onSubSectionClick(subSectionId: string, rowIndex: number) {
  await router.push(
    `?sectionId=${subSectionId}&row=${rowIndex}&parentSectionId=${props.dataSection.id}`,
  );
}
</script>

<template>
  <div class="-mx-4 mt-8 sm:mx-0">
    <DataTable :value="dataSection.dataValues" table-style="min-width: 50rem">
      <Column>
        <template #body="{ index }">
          <Button v-slot="slotProps" as-child aria-label="Search">
            <RouterLink
              :to="`?sectionId=${dataSection.id}&row=${index}&parentSectionId=${dataSection.id}`"
              :class="slotProps.class"
            >
              {{ t("presentation.moreInfo") }}
            </RouterLink>
          </Button>
        </template>
      </Column>
      <Column
        v-for="dataField in dataSection.dataFields"
        :key="dataField.id"
        :field="dataField.name"
        :header="dataField.name"
      >
        <template #body="slotProps">
          <DataValue
            :field-view="{
              dataField,
              value: slotProps.data[dataField.id],
            }"
          />
        </template>
      </Column>
      <Column
        v-if="subSections && subSections.length > 0"
        :header="t('presentation.additionalSections')"
      >
        <template #body="{ index }">
          <div class="grid grid-cols-3 gap-1">
            <Chip
              v-for="subSection in subSections"
              :key="subSection.id"
              :data-cy="`${subSection.id}_${index}`"
              class="cursor-pointer"
              :label="subSection.name" @click="onSubSectionClick(subSection.id, index)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
