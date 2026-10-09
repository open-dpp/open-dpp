<script lang="ts" setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useListFilterState } from "../../composables/list-filter-state.ts";
import { useRegistryExport } from "../../composables/registry-export.ts";
import DigitalProductDocumentFilterBar from "../digital-product-document/DigitalProductDocumentFilterBar.vue";

const { t } = useI18n();

const visible = ref(false);
const { templateIds, period, filter, hasActiveFilters, reset } = useListFilterState();
const { exporting, exportToRegistry } = useRegistryExport();

// Only the product group batteries is supported at the moment.
const productGroups = [{ value: "BATTERIES", label: t("passports.registryExport.batteries") }];
const productGroup = ref("BATTERIES");

function open() {
  // The dialog has its own filter, independent of the one of the passport overview.
  reset();
  visible.value = true;
}

async function onExport() {
  if (await exportToRegistry(filter.value)) {
    visible.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Dialog
    v-model:visible="visible"
    class="w-3/4"
    modal
    :header="t('passports.registryExport.title')"
    data-cy="registry-export-dialog"
  >
    <div class="mb-6 flex flex-col gap-4">
      <p class="text-sm text-gray-600">{{ t("passports.registryExport.description") }}</p>
      <div class="flex flex-col gap-1">
        <label for="registry-product-group">{{ t("passports.registryExport.productGroup") }}</label>
        <Select
          v-model="productGroup"
          input-id="registry-product-group"
          :options="productGroups"
          option-label="label"
          option-value="value"
          disabled
          fluid
        />
      </div>
      <div class="flex flex-col gap-1">
        <span>{{ t("passports.registryExport.filters") }}</span>
        <DigitalProductDocumentFilterBar
          v-model:template-ids="templateIds"
          v-model:period="period"
          :show-status="false"
          show-templates
          :has-active-filters="hasActiveFilters"
          @reset="reset"
        />
        <small class="text-gray-600">
          {{ t("passports.registryExport.onlyStatus", { status: t("status.published") }) }}
        </small>
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" severity="secondary" @click="visible = false">
        {{ t("common.cancel") }}
      </Button>
      <Button :loading="exporting" data-cy="registry-export-submit" @click="onExport">
        {{ t("passports.registryExport.export") }}
      </Button>
    </div>
  </Dialog>
</template>
