<template>
  <form-kit
    id="createOrganizationForm"
    :actions="false"
    outer-class="w-full"
    type="form"
    @submit="create"
  >
    <form-kit
      :allow-incomplete="false"
      :wrapper-class="{ 'w-full': true }"
      name="stepper"
      tab-style="tab"
      type="multi-step"
    >
      <form-kit
        :wrapper-class="{ 'w-full': true }"
        :label="t('common.general')"
        name="generalInfo"
        type="step"
      >
        <form-kit
          :help="t('organizations.form.name.help')"
          :label="t('organizations.form.name.label')"
          name="name"
          type="text"
          validation="required"
        />
        <template #stepNext>
          <FormKit :label="t('common.create')" type="submit" />
        </template>
      </form-kit>
    </form-kit>
  </form-kit>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { reset } from '@formkit/core';
import { useOrganizationsStore } from '../../stores/organizations';
import { useIndexStore } from '../../stores';
import { useRouter } from 'vue-router';
import keycloakIns, { updateKeycloakToken } from '../../lib/keycloak';
import { useI18n } from 'vue-i18n';

const router = useRouter();

const { t } = useI18n();

const indexStore = useIndexStore();
const organizationStore = useOrganizationsStore();

const submitted = ref(false);

const create = async (fields: {
  stepper: {
    generalInfo: {
      name: string;
    };
  };
}) => {
  const responseData = await organizationStore.createOrganization({
    name: fields.stepper.generalInfo.name,
  });
  await new Promise((resolve) => setTimeout(resolve, 250));
  await updateKeycloakToken(keycloakIns, 1000);
  submitted.value = true;
  reset('createOrganizationForm');
  await organizationStore.fetchOrganizations();
  indexStore.selectOrganization(responseData.id);
  await router.push('/');
};
</script>
