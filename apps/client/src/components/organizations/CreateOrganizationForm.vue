<script lang="ts" setup>
import { reset } from "@formkit/core";
import { ref } from "vue";
import { useRouter } from "vue-router";
import keycloakIns, { updateKeycloakToken } from "../../lib/keycloak";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations";

const router = useRouter();

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
  await new Promise(resolve => setTimeout(resolve, 250));
  await updateKeycloakToken(keycloakIns, 1000);
  submitted.value = true;
  reset("createOrganizationForm");
  await organizationStore.fetchOrganizations();
  indexStore.selectOrganization(responseData.id);
  await router.push("/");
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
        label="Allgemein"
        name="generalInfo"
        type="step"
      >
        <form-kit
          help="Geben Sie Ihrer Organisation einen Namen"
          label="Name"
          name="name"
          type="text"
          validation="required"
        />
        <template #stepNext>
          <FormKit label="Erstellen" type="submit" />
        </template>
      </form-kit>
    </form-kit>
  </form-kit>
</template>
