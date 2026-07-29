<script lang="ts" setup>
import type { BulkImportConfigDto } from "@open-dpp/dto";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useBulkImportConfigRepo } from "../../composables/bulk-import-config-repo.ts";

const emit = defineEmits<{
  (e: "use-existing", config: BulkImportConfigDto): void;
  (e: "use-new"): void;
}>();

const { t } = useI18n();
const configRepo = useBulkImportConfigRepo();

const visible = ref(false);
const selectedConfigId = ref<string | null>(null);
const configs = ref<BulkImportConfigDto[]>([]);

function open() {
  selectedConfigId.value = null;
  visible.value = true;
  loadConfigs();
}

async function loadConfigs() {
  const fetchedConfigs = await configRepo.fetchConfigs();
  if (fetchedConfigs) configs.value = fetchedConfigs;
}

function close() {
  visible.value = false;
}

defineExpose({ open });

function useExisting() {
  const config = configs.value.find((c) => c.id === selectedConfigId.value);
  if (!config) return;
  close();
  emit("use-existing", config);
}

function useNew() {
  close();
  emit("use-new");
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="t('integrations.bulkImport.newOrExisting')"
    :style="{ width: '32rem' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <label class="flex flex-col gap-2">
        <span>{{ t("integrations.bulkImport.selectExistingConfig") }}</span>
        <Select
          v-model="selectedConfigId"
          :options="configs"
          option-value="id"
          option-label="name"
          :placeholder="t('integrations.bulkImport.selectExistingConfig')"
        />
      </label>
      <Button
        :disabled="!selectedConfigId"
        :label="t('integrations.bulkImport.useExisting')"
        @click="useExisting"
      />
      <Button severity="secondary" :label="t('integrations.bulkImport.useNew')" @click="useNew" />
    </div>
  </Dialog>
</template>
