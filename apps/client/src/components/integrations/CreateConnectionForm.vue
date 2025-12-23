<script lang="ts" setup>
import { AssetAdministrationShellType } from "@open-dpp/api-client";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { z } from "zod/v4";
import { AAS_NAME_MAPPING } from "../../lib/aas-name-mapping";
import { useIndexStore } from "../../stores";
import { useAasConnectionStore } from "../../stores/aas.connection";
import { useModelsStore } from "../../stores/models";
import { useNotificationStore } from "../../stores/notification";

const { t } = useI18n();
const modelsStore = useModelsStore();
const aasConnectionStore = useAasConnectionStore();
const notificationsStore = useNotificationStore();
const indexStore = useIndexStore();
const router = useRouter();

const name = ref("");
const modelId = ref("");
const aasType = ref<AssetAdministrationShellType | null>(null);
const errors = ref<{ name?: string; modelId?: string; aasType?: string }>({});

const selectableModels = computed(() =>
  modelsStore.models.map(m => ({ label: `${m.name} ${m.id}`, value: m.id })),
);

const selectableAasTypes = computed(() => [
  {
    label: t(AAS_NAME_MAPPING[AssetAdministrationShellType.Truck]),
    value: AssetAdministrationShellType.Truck,
  },
  {
    label: t(AAS_NAME_MAPPING[AssetAdministrationShellType.Semitrailer]),
    value: AssetAdministrationShellType.Semitrailer,
  },
  {
    label: t(AAS_NAME_MAPPING[AssetAdministrationShellType.Semitrailer_Truck]),
    value: AssetAdministrationShellType.Semitrailer_Truck,
  },
]);

function validate() {
  errors.value = {};
  let isValid = true;
  if (!name.value) {
    errors.value.name = t("validation.required");
    isValid = false;
  }
  if (!modelId.value) {
    errors.value.modelId = t("validation.required");
    isValid = false;
  }
  if (!aasType.value) {
    errors.value.aasType = t("validation.required");
    isValid = false;
  }
  return isValid;
}

async function create() {
  if (!validate()) {
    return;
  }
  try {
    const fields = z
      .object({
        name: z.string(),
        modelId: z.string(),
        aasType: z.enum(AssetAdministrationShellType),
      })
      .parse({ name: name.value, modelId: modelId.value, aasType: aasType.value });

    const model = modelsStore.models.find(m => m.id === fields.modelId);
    if (model && model.templateId) {
      const aasConnection = await aasConnectionStore.createConnection({
        name: fields.name,
        modelId: model.id,
        dataModelId: model.templateId,
        aasType: fields.aasType,
        fieldAssignments: [],
      });
      await router.push(
        `/organizations/${indexStore.selectedOrganization}/integrations/pro-alpha/connections/${aasConnection.id}`,
      );
    }
    else {
      notificationsStore.addErrorNotification(
        t("integrations.connections.errorCreate"),
      );
    }
  }
  catch (e) {
    console.error(e);
    // Optional: Handle validation error if parse fails, though manual validate() should cover it
  }
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="create">
    <div class="flex flex-col gap-2">
      <label for="name" class="block text-sm font-medium text-gray-700">
        {{ t('integrations.connections.name.label') }}
      </label>
      <InputText
        id="name"
        v-model="name"
        type="text"
        :invalid="!!errors.name"
        class="w-full"
        data-cy="name"
      />
      <small v-if="errors.name" class="text-red-600">{{ errors.name }}</small>
      <small v-else class="text-gray-500">{{ t('integrations.connections.name.help') }}</small>
    </div>

    <div class="flex flex-col gap-2">
      <label for="modelId" class="block text-sm font-medium text-gray-700">
        {{ t('integrations.connections.model.label') }}
      </label>
      <Select
        id="modelId"
        v-model="modelId"
        :options="selectableModels"
        option-label="label"
        option-value="value"
        :invalid="!!errors.modelId"
        class="w-full"
        data-cy="select-model"
      />
      <small v-if="errors.modelId" class="text-red-600">{{ errors.modelId }}</small>
      <small v-else class="text-gray-500">{{ t('integrations.connections.model.help') }}</small>
    </div>

    <div class="flex flex-col gap-2">
      <label for="aasType" class="block text-sm font-medium text-gray-700">
        {{ t('integrations.connections.aas.label') }}
      </label>
      <Select
        id="aasType"
        v-model="aasType"
        :options="selectableAasTypes"
        option-label="label"
        option-value="value"
        :invalid="!!errors.aasType"
        class="w-full"
        data-cy="select-aas-type"
      />
      <small v-if="errors.aasType" class="text-red-600">{{ errors.aasType }}</small>
      <small v-else class="text-gray-500">{{ t('integrations.connections.aas.help') }}</small>
    </div>

    <div class="mt-4">
      <Button :label="t('common.create')" type="submit" />
    </div>
  </form>
</template>
