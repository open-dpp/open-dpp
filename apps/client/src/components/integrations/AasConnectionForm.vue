<script setup lang="ts">
import Button from "primevue/button";
import Select from "primevue/select";
import { useI18n } from "vue-i18n";
import { useAasConnectionFormStore } from "../../stores/aas.connection.form";

const { t } = useI18n();
const aasConnectionFormStore = useAasConnectionFormStore();

async function onSubmit() {
  await aasConnectionFormStore.submitModifications();
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div
      v-for="(assignment, index) in aasConnectionFormStore.fieldAssignments"
      :key="assignment.id"
      class="flex flex-col items-center justify-around gap-2 md:flex-row"
    >
      <div class="w-full flex-1">
        <label class="mb-1 block text-sm font-medium text-gray-700 md:hidden">
          {{ t("integrations.connections.aas.field") }}
        </label>
        <Select
          v-model="assignment.aas"
          :options="aasConnectionFormStore.aasProperties"
          option-label="label"
          option-value="value"
          option-group-label="group"
          option-group-children="options"
          :placeholder="t('integrations.connections.aas.selectField')"
          class="w-full"
        />
      </div>

      <div class="flex items-center">
        {{ t("integrations.connections.aas.isLinked") }}
      </div>

      <div class="w-full flex-1">
        <label class="mb-1 block text-sm font-medium text-gray-700 md:hidden">
          {{ t("integrations.connections.aas.modelField") }}
        </label>
        <Select
          v-model="assignment.dpp"
          :options="aasConnectionFormStore.templateOptions"
          option-label="label"
          option-value="value"
          option-group-label="group"
          option-group-children="options"
          :placeholder="t('integrations.connections.aas.selectModelField')"
          class="w-full"
        />
      </div>

      <Button
        icon="pi pi-trash"
        severity="danger"
        text
        @click="aasConnectionFormStore.removeFieldAssignmentRow(index)"
      />
    </div>

    <div class="flex justify-end">
      <Button
        label="Add Row"
        icon="pi pi-plus"
        severity="secondary"
        @click="aasConnectionFormStore.addFieldAssignmentRow"
      />
    </div>

    <div class="mt-4 border-t border-gray-300 pt-4">
      <Button :label="t('common.save')" type="submit" />
    </div>
  </form>
</template>
