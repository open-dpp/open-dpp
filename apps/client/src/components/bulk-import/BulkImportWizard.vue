<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBulkImportConfigDetails } from "../../composables/bulk-import/bulk-import-config-details.ts";
import { useBulkImportConfigRepo } from "../../composables/bulk-import/bulk-import-config.repo.ts";
import { useBulkImportFileUpload } from "../../composables/bulk-import/bulk-import-file-upload.ts";
import { useBulkImportMapping } from "../../composables/bulk-import/bulk-import-mapping.ts";
import { useBulkImportRunRepo } from "../../composables/bulk-import/bulk-import-run.repo.ts";
import { useBulkImportWizard } from "../../composables/bulk-import/bulk-import-wizard.ts";
import ConfigDetailsStep from "./steps/ConfigDetailsStep.vue";
import MappingStep from "./steps/MappingStep.vue";
import UploadTemplateStep from "./steps/UploadTemplateStep.vue";

const emit = defineEmits<{ (e: "run-triggered", runId: string): void }>();

const { t } = useI18n();

const fileUpload = useBulkImportFileUpload();
const mapping = useBulkImportMapping();
const configDetails = useBulkImportConfigDetails();
const configRepo = useBulkImportConfigRepo();
const runRepo = useBulkImportRunRepo();

const wizard = useBulkImportWizard({ fileUpload, mapping, configDetails, configRepo, runRepo });

defineExpose({ open: wizard.open });

async function onSubmit() {
  const run = await wizard.submit();
  if (run) {
    emit("run-triggered", run.id);
  }
}
</script>

<template>
  <Dialog
    v-model:visible="wizard.visible.value"
    modal
    :header="
      wizard.isNewConfig.value
        ? t('integrations.bulkImport.newConfig')
        : t('integrations.bulkImport.uploadFile')
    "
    :style="{ width: '48rem' }"
    @hide="wizard.close"
  >
    <UploadTemplateStep v-if="!wizard.isNewConfig.value" :file-upload="fileUpload" />

    <Stepper v-else v-model:value="wizard.currentStep.value" linear>
      <StepList>
        <Step :value="1">{{ t("integrations.bulkImport.uploadFile") }}</Step>
        <Step :value="2">{{ t("integrations.bulkImport.mapFields") }}</Step>
        <Step :value="3">{{ t("integrations.bulkImport.configDetails") }}</Step>
      </StepList>
      <StepPanels>
        <StepPanel :value="1">
          <UploadTemplateStep :file-upload="fileUpload" :mapping="mapping" />
        </StepPanel>
        <StepPanel :value="2">
          <MappingStep :file-upload="fileUpload" :mapping="mapping" />
        </StepPanel>
        <StepPanel :value="3">
          <ConfigDetailsStep :file-upload="fileUpload" :config-details="configDetails" />
        </StepPanel>
      </StepPanels>
    </Stepper>

    <div class="mt-6 flex justify-end gap-2">
      <Button type="button" severity="secondary" @click="wizard.close">
        {{ t("common.cancel") }}
      </Button>
      <template v-if="wizard.isNewConfig.value">
        <Button
          v-if="wizard.currentStep.value > 1"
          severity="secondary"
          @click="wizard.previousStep"
        >
          {{ t("integrations.bulkImport.previous") }}
        </Button>
        <Button
          v-if="wizard.currentStep.value === 1"
          :disabled="!wizard.canGoToMapping.value"
          @click="wizard.nextStep"
        >
          {{ t("integrations.bulkImport.next") }}
        </Button>
        <Button
          v-if="wizard.currentStep.value === 2"
          :disabled="!wizard.canGoToDetails.value"
          @click="wizard.nextStep"
        >
          {{ t("integrations.bulkImport.next") }}
        </Button>
        <Button
          v-if="wizard.currentStep.value === 3"
          :disabled="!wizard.canSubmitNewConfig.value || wizard.submitting.value"
          @click="onSubmit"
        >
          {{ t("integrations.bulkImport.createAndRun") }}
        </Button>
      </template>
      <Button
        v-else
        :disabled="!wizard.canSubmitExistingConfig.value || wizard.submitting.value"
        @click="onSubmit"
      >
        {{ t("integrations.bulkImport.runNow") }}
      </Button>
    </div>
  </Dialog>
</template>
