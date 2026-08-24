<script lang="ts" setup>
import type { OrganizationDto } from "@open-dpp/api-client";
import { BuildingOfficeIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import Button from "primevue/button";
import Message from "primevue/message";
import Select from "primevue/select";
import { Dialog } from "primevue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import RingLoader from "../navigation/RingLoader.vue";

const { t } = useI18n();
const visible = ref(false);
const loading = ref(false);
const userEmail = ref<string | null>(null);
const selectedOrganizationId = ref<string | null>(null);
const loadingOrganizations = ref(true);
const errors = ref<string[]>([]);
const success = ref(false);
const organizations = ref<OrganizationDto[]>([]);

async function openInviteDialog(email: string) {
  userEmail.value = email;
  success.value = false;
  errors.value = [];
  selectedOrganizationId.value = null;
  visible.value = true;
}

onMounted(async () => {
  try {
    const { data } = await apiClient.dpp.organizations.getMemberOrganizations();
    organizations.value = data;
  } catch {
    errors.value.push(t("common.errorOccurred"));
  } finally {
    loadingOrganizations.value = false;
  }
});

async function inviteToOrganization() {
  if (!selectedOrganizationId.value || !userEmail.value) {
    return;
  }

  success.value = false;
  errors.value = [];

  try {
    loading.value = true;
    await apiClient.dpp.organizations.inviteUser(userEmail.value, selectedOrganizationId.value);
    success.value = true;
    visible.value = false;
  } catch (error) {
    errors.value.push(t("organizations.admin.inviteToOrganizationDialog.error"));
  } finally {
    loading.value = false;
  }
}

defineExpose({
  openInviteDialog,
});
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="t('organizations.admin.inviteToOrganizationDialog.title')"
    modal
  >
    <div>
      <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100">
        <BuildingOfficeIcon aria-hidden="true" class="size-6 text-blue-600" />
      </div>
      <div class="mt-3 text-center sm:mt-5">
        <p class="mt-1 text-sm text-gray-500">
          {{ userEmail }}
        </p>
        <div v-if="success" class="mt-3">
          <div class="text-sm text-green-600">
            {{ t("organizations.admin.inviteToOrganizationDialog.success") }}
          </div>
          <button
            class="mt-3 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-hidden"
            type="button"
            @click="visible = false"
          >
            {{ t("common.close") }}
          </button>
        </div>
        <div v-else-if="loadingOrganizations" class="mt-3">
          <RingLoader class="mx-auto w-fit" />
        </div>
        <div v-else class="mt-3">
          <form class="flex flex-col gap-4" @submit.prevent="inviteToOrganization">
            <div v-if="errors.length" class="flex flex-col gap-1">
              <Message v-for="error in errors" :key="error" severity="error" :closable="false">
                {{ error }}
              </Message>
            </div>

            <Select
              v-model="selectedOrganizationId"
              :options="organizations"
              option-label="name"
              option-value="id"
              :placeholder="t('organizations.admin.inviteToOrganizationDialog.selectOrganization')"
              class="w-full"
            />

            <Button
              :label="t('organizations.admin.inviteToOrganizationDialog.invite')"
              type="submit"
              :loading="loading"
              :disabled="!selectedOrganizationId"
              class="w-full"
            />
          </form>
        </div>
      </div>
    </div>
  </Dialog>
</template>
