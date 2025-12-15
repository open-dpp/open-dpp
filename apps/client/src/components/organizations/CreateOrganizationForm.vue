<script lang="ts" setup>
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations";

const router = useRouter();

const { t } = useI18n();

const indexStore = useIndexStore();
const organizationStore = useOrganizationsStore();

const organizationName = ref("");

async function create() {
  const responseData = await organizationStore.createOrganization({
    name: organizationName.value,
  });
  if (responseData) {
    await new Promise(resolve => setTimeout(resolve, 250));
    organizationName.value = ""; // Reset form
    await organizationStore.fetchOrganizations();
    indexStore.selectOrganization(responseData.id);
    await router.push("/");
  }
}
</script>

<template>
  <form class="w-full" @submit.prevent="create">
    <div class="w-full">
      <h3 class="mb-4">
        {{ t('common.general') }}
      </h3>

      <div class="field">
        <label for="organization-name" class="block mb-2">
          {{ t('organizations.form.name.label') }}
        </label>
        <InputText
          id="organization-name"
          v-model="organizationName"
          class="w-full"
          :required="true"
          aria-describedby="organization-name-help"
        />
        <small id="organization-name-help" class="block mt-2">
          {{ t('organizations.form.name.help') }}
        </small>
      </div>

      <div class="mt-4">
        <Button
          type="submit"
          :label="t('common.create')"
          :disabled="!organizationName"
        />
      </div>
    </div>
  </form>
</template>
