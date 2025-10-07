<script setup lang="ts">
import { useAasConnectionFormStore } from "../../stores/aas.connection.form";

const { t } = useI18n();
const aasConnectionFormStore = useAasConnectionFormStore();

async function onSubmit() {
  await aasConnectionFormStore.submitModifications();
}
</script>

<template>
  <FormKit
    v-model="aasConnectionFormStore.formData"
    :actions="false"
    type="form"
    @submit="onSubmit"
  >
    <FormKitSchema
      v-if="aasConnectionFormStore.formSchema"
      :schema="aasConnectionFormStore.formSchema"
    />
    <FormKit :label="t('common.save')" type="submit" />
  </FormKit>
</template>
