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
    <FormKit label="Speichern" type="submit" />
  </FormKit>
</template>

<script setup lang="ts">
import { useAasConnectionFormStore } from '../../stores/aas.connection.form';

const aasConnectionFormStore = useAasConnectionFormStore();

const onSubmit = async () => {
  await aasConnectionFormStore.submitModifications();
};
</script>
