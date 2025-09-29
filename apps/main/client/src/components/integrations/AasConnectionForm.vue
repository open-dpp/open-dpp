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

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAasConnectionFormStore } from '../../stores/aas.connection.form';

const { t } = useI18n();
const aasConnectionFormStore = useAasConnectionFormStore();

const onSubmit = async () => {
  await aasConnectionFormStore.submitModifications();
};
</script>
