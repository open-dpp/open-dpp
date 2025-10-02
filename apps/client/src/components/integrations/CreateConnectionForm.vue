<script lang="ts" setup>
import { AssetAdministrationShellType } from "@open-dpp/api-client";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod/v4";
import { AAS_NAME_MAPPING } from "../../lib/aas-name-mapping";
import { useIndexStore } from "../../stores";
import { useAasConnectionStore } from "../../stores/aas.connection";
import { useModelsStore } from "../../stores/models";
import { useNotificationStore } from "../../stores/notification";

const modelsStore = useModelsStore();
const aasConnectionStore = useAasConnectionStore();
const notificationsStore = useNotificationStore();
const indexStore = useIndexStore();
const router = useRouter();
const selectableModels = computed(() =>
  modelsStore.models.map(m => ({ label: `${m.name} ${m.id}`, value: m.id })),
);

const selectableAasTypes = [
  {
    label: AAS_NAME_MAPPING[AssetAdministrationShellType.Truck],
    value: AssetAdministrationShellType.Truck,
  },
  {
    label: AAS_NAME_MAPPING[AssetAdministrationShellType.Semitrailer],
    value: AssetAdministrationShellType.Semitrailer,
  },
  {
    label: AAS_NAME_MAPPING[AssetAdministrationShellType.Semitrailer_Truck],
    value: AssetAdministrationShellType.Semitrailer_Truck,
  },
];

async function create(formFields: unknown) {
  const fields = z
    .object({
      name: z.string(),
      modelId: z.string(),
      aasType: z.enum(AssetAdministrationShellType),
    })
    .parse(formFields);
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
      "Erstellen der Verbindung fehlgeschlagen",
    );
  }
}
</script>

<template>
  <form-kit id="createDraftForm" :actions="false" type="form" @submit="create">
    <form-kit
      data-cy="name"
      help="Geben Sie Ihrer Verbindung einen Namen"
      label="Name"
      name="name"
      type="text"
      validation="required"
    />
    <form-kit
      :options="selectableModels"
      data-cy="select-model"
      help="Wählen Sie einen Modellpass, für den Sie Artikpässe über diese Verbindung erstellen möchten"
      label="Modellpass Auswahl"
      name="modelId"
      type="select"
      validation="required"
    />
    <form-kit
      :options="selectableAasTypes"
      data-cy="select-aas-type"
      help="Wählen Sie eine Asset Admininstration Shell"
      label="Asset Admininstration Shell Auswahl"
      name="aasType"
      type="select"
      validation="required"
    />
    <form-kit label="Erstellen" type="submit" />
  </form-kit>
</template>
