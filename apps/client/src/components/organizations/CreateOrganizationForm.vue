<script lang="ts" setup>
import { reset } from "@formkit/core";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useIndexStore } from "../../stores";

import { useOrganizationsStore } from "../../stores/organizations";

const router = useRouter();

const { t } = useI18n();

const indexStore = useIndexStore();
const organizationStore = useOrganizationsStore();

const submitted = ref(false);

async function create(fields: {
  stepper: {
    generalInfo: {
      name: string;
    };
  };
}) {
  const responseData = await organizationStore.createOrganization({
    name: fields.stepper.generalInfo.name,
  });
  if (responseData) {
    await new Promise(resolve => setTimeout(resolve, 250));
    submitted.value = true;
    reset("createOrganizationForm");
    await organizationStore.fetchOrganizations();
    indexStore.selectOrganization(responseData.id);
    await router.push("/");
  }
}
</script>

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
