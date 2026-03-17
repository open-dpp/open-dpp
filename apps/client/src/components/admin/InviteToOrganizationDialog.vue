<script lang="ts" setup>
import type { OrganizationDto } from "@open-dpp/api-client";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { BuildingOfficeIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import Button from "primevue/button";
import Message from "primevue/message";
import Select from "primevue/select";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import RingLoader from "../RingLoader.vue";

const props = defineProps<{
  userEmail: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "success"): void;
}>();

const { t } = useI18n();
const loading = ref(false);
const loadingOrganizations = ref(true);
const errors = ref<string[]>([]);
const success = ref(false);
const organizations = ref<OrganizationDto[]>([]);
const selectedOrganizationId = ref<string | null>(null);

onMounted(async () => {
  try {
    const { data } = await apiClient.dpp.organizations.getMemberOrganizations();
    organizations.value = data;
  }
  catch {
    errors.value.push(t("common.errorOccurred"));
  }
  finally {
    loadingOrganizations.value = false;
  }
});

async function inviteToOrganization() {
  if (!selectedOrganizationId.value) {
    return;
  }

  success.value = false;
  errors.value = [];

  try {
    loading.value = true;
    await apiClient.dpp.organizations.inviteUser(
      props.userEmail,
      selectedOrganizationId.value,
    );
    success.value = true;
    emit("success");
  }
  catch (error) {
    console.error(error);
    errors.value.push(t("organizations.admin.inviteToOrganizationDialog.error"));
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <TransitionRoot :show="true" as="template">
    <Dialog class="relative z-10" @close="emit('close')">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500/75 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6"
            >
              <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  type="button"
                  @click="emit('close')"
                >
                  <span class="sr-only">{{ t('common.close') }}</span>
                  <XMarkIcon aria-hidden="true" class="size-6" />
                </button>
              </div>
              <div>
                <div
                  class="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100"
                >
                  <BuildingOfficeIcon
                    aria-hidden="true"
                    class="size-6 text-blue-600"
                  />
                </div>
                <div class="mt-3 text-center sm:mt-5">
                  <DialogTitle
                    as="h3"
                    class="text-base font-semibold text-gray-900"
                  >
                    {{ t('organizations.admin.inviteToOrganizationDialog.title') }}
                  </DialogTitle>
                  <p class="mt-1 text-sm text-gray-500">
                    {{ userEmail }}
                  </p>
                  <div v-if="success" class="mt-3">
                    <div class="text-sm text-green-600">
                      {{ t('organizations.admin.inviteToOrganizationDialog.success') }}
                    </div>
                    <button
                      class="mt-3 rounded-md bg-green-600 text-white px-3 py-2 text-sm font-semibold shadow-xs hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      type="button"
                      @click="emit('close')"
                    >
                      {{ t('common.close') }}
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

                      <div class="flex flex-col gap-2">
                        <label for="organization" class="block text-sm font-medium text-gray-700">
                          {{ t('organizations.admin.inviteToOrganizationDialog.selectOrganization') }}
                        </label>
                        <Select
                          v-model="selectedOrganizationId"
                          :options="organizations"
                          option-label="name"
                          option-value="id"
                          :placeholder="t('organizations.admin.inviteToOrganizationDialog.selectOrganization')"
                          class="w-full"
                        />
                      </div>

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
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
