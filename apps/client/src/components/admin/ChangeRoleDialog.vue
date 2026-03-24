<script lang="ts" setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { ShieldCheckIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { isAxiosError } from "axios";
import Button from "primevue/button";
import Message from "primevue/message";
import Select from "primevue/select";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client.ts";
import RingLoader from "../RingLoader.vue";

const props = defineProps<{
  userId: string;
  userEmail: string;
  currentRole: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "success"): void;
}>();

const { t } = useI18n();
const loading = ref(false);
const errors = ref<string[]>([]);
const success = ref(false);
const confirming = ref(false);
const selectedRole = ref<"admin" | "user">(props.currentRole as "admin" | "user");

const roleOptions = computed(() => [
  { label: t("organizations.admin.changeRoleDialog.roleAdmin"), value: "admin" },
  { label: t("organizations.admin.changeRoleDialog.roleUser"), value: "user" },
]);

const selectedRoleLabel = computed(() => {
  const option = roleOptions.value.find(o => o.value === selectedRole.value);
  return option?.label ?? selectedRole.value;
});

const currentRoleLabel = computed(() => {
  const option = roleOptions.value.find(o => o.value === props.currentRole);
  return option?.label ?? props.currentRole;
});

const isEscalation = computed(() => selectedRole.value === "admin" && props.currentRole !== "admin");

function requestChangeRole() {
  if (!selectedRole.value || selectedRole.value === props.currentRole) {
    return;
  }

  if (isEscalation.value) {
    confirming.value = true;
    return;
  }

  changeRole();
}

function cancelConfirmation() {
  confirming.value = false;
}

async function changeRole() {
  confirming.value = false;
  success.value = false;
  errors.value = [];

  try {
    loading.value = true;
    await apiClient.dpp.users.setRole(props.userId, {
      role: selectedRole.value,
    });
    success.value = true;
    emit("success");
  }
  catch (error) {
    console.error(error);
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 403 || status === 401) {
        errors.value.push(t("organizations.admin.changeRoleDialog.errorForbidden"));
      }
      else if (status === 404) {
        errors.value.push(t("organizations.admin.changeRoleDialog.errorNotFound"));
      }
      else {
        errors.value.push(t("organizations.admin.changeRoleDialog.error"));
      }
    }
    else {
      errors.value.push(t("organizations.admin.changeRoleDialog.error"));
    }
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
                  class="mx-auto flex size-12 items-center justify-center rounded-full bg-purple-100"
                >
                  <ShieldCheckIcon
                    aria-hidden="true"
                    class="size-6 text-purple-600"
                  />
                </div>
                <div class="mt-3 text-center sm:mt-5">
                  <DialogTitle
                    as="h3"
                    class="text-base font-semibold text-gray-900"
                  >
                    {{ t('organizations.admin.changeRoleDialog.title') }}
                  </DialogTitle>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      {{ userEmail }}
                    </p>
                    <p class="text-xs text-gray-400">
                      {{ t('organizations.admin.changeRoleDialog.currentRole', { role: currentRoleLabel }) }}
                    </p>
                  </div>
                  <div v-if="success" class="mt-3">
                    <div class="text-sm text-green-600">
                      {{ t('organizations.admin.changeRoleDialog.success', { role: selectedRoleLabel }) }}
                    </div>
                    <button
                      class="mt-3 rounded-md bg-green-600 text-white px-3 py-2 text-sm font-semibold shadow-xs hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      type="button"
                      @click="emit('close')"
                    >
                      {{ t('common.close') }}
                    </button>
                  </div>
                  <div v-else-if="confirming" class="mt-3">
                    <Message severity="warn" :closable="false">
                      {{ t('organizations.admin.changeRoleDialog.confirmEscalation') }}
                    </Message>
                    <div class="mt-4 flex gap-3">
                      <Button
                        :label="t('common.cancel')"
                        severity="secondary"
                        class="flex-1"
                        @click="cancelConfirmation"
                      />
                      <Button
                        :label="t('organizations.admin.changeRoleDialog.confirmChange')"
                        severity="danger"
                        class="flex-1"
                        @click="changeRole"
                      />
                    </div>
                  </div>
                  <div v-else class="mt-3">
                    <form v-show="!loading" class="flex flex-col gap-4" @submit.prevent="requestChangeRole">
                      <div v-if="errors.length" class="flex flex-col gap-1">
                        <Message v-for="error in errors" :key="error" severity="error" :closable="false">
                          {{ error }}
                        </Message>
                      </div>

                      <div class="flex flex-col gap-2">
                        <label for="role" class="block text-sm font-medium text-gray-700">
                          {{ t('organizations.admin.changeRoleDialog.selectRole') }}
                        </label>
                        <Select
                          id="role"
                          v-model="selectedRole"
                          :options="roleOptions"
                          option-label="label"
                          option-value="value"
                          :placeholder="t('organizations.admin.changeRoleDialog.selectRole')"
                          class="w-full"
                        />
                      </div>

                      <Button
                        :label="t('organizations.admin.changeRoleDialog.change')"
                        type="submit"
                        :loading="loading"
                        :disabled="!selectedRole || selectedRole === currentRole"
                        class="w-full"
                      />
                    </form>
                    <RingLoader v-show="loading" class="mx-auto w-fit" />
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
