<script lang="ts" setup>
import { isAxiosError } from "axios";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
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
const visible = ref(true);
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

  const MIN_LOADING_MS = 400;

  try {
    loading.value = true;
    await Promise.all([
      apiClient.dpp.users.setRole(props.userId, {
        role: selectedRole.value,
      }),
      new Promise(resolve => setTimeout(resolve, MIN_LOADING_MS)),
    ]);
    success.value = true;
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
  <Dialog
    v-model:visible="visible"
    modal
    :header="t('organizations.admin.changeRoleDialog.title')"
    class="w-full sm:w-[28rem]"
    @hide="success ? emit('success') : emit('close')"
  >
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-100"
        >
          <i class="pi pi-user text-purple-600" aria-hidden="true" />
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-gray-900">
            {{ userEmail }}
          </p>
          <p class="text-xs text-gray-500">
            {{ t('organizations.admin.changeRoleDialog.currentRole', { role: currentRoleLabel }) }}
          </p>
        </div>
      </div>

      <div v-if="success" class="flex flex-col gap-4">
        <Message severity="success" :closable="false">
          {{ t('organizations.admin.changeRoleDialog.success', { role: selectedRoleLabel }) }}
        </Message>
        <div class="flex justify-end">
          <Button
            :label="t('common.close')"
            severity="success"
            @click="emit('success')"
          />
        </div>
      </div>

      <div v-else-if="confirming" class="flex flex-col gap-4">
        <Message severity="warn" :closable="false">
          {{ t('organizations.admin.changeRoleDialog.confirmEscalation') }}
        </Message>
        <div class="flex justify-end gap-2">
          <Button
            :label="t('common.cancel')"
            severity="secondary"
            @click="cancelConfirmation"
          />
          <Button
            :label="t('organizations.admin.changeRoleDialog.confirmChange')"
            severity="danger"
            @click="changeRole"
          />
        </div>
      </div>

      <template v-else>
        <form v-show="!loading" class="flex flex-col gap-4" @submit.prevent="requestChangeRole">
          <div v-if="errors.length" class="flex flex-col gap-2">
            <Message v-for="error in errors" :key="error" severity="error" :closable="false">
              {{ error }}
            </Message>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="role" class="text-sm font-medium text-gray-700">
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

          <div class="flex justify-end">
            <Button
              :label="t('organizations.admin.changeRoleDialog.change')"
              type="submit"
              :loading="loading"
              :disabled="!selectedRole || selectedRole === currentRole"
            />
          </div>
        </form>
        <RingLoader v-show="loading" class="mx-auto w-fit" />
      </template>
    </div>
  </Dialog>
</template>
