<script lang="ts" setup>
import { EnvelopeIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { z } from "zod";
import apiClient from "../../lib/api-client.ts";
import RingLoader from "../navigation/RingLoader.vue";

const emit = defineEmits<{
  (e: "success"): void;
}>();

const { t } = useI18n();
const visible = ref(false);
const loading = ref(false);
const errors = ref<Array<string>>([]);
const success = ref(false);
const organizationId = ref<string | null>(null);
const email = ref("");
const emailError = ref("");

async function inviteUser() {
  if (!organizationId.value) {
    return;
  }

  const emailSchema = z.email();
  const result = emailSchema.safeParse(email.value);

  if (!result.success) {
    emailError.value = t("common.form.email.invalid");
    return;
  }

  try {
    loading.value = true;
    const response = await apiClient.dpp.organizations.inviteUser(
      email.value,
      organizationId.value,
    );
    loading.value = false;
    if (response.status === 201) {
      success.value = true;
      emit("success");
      visible.value = false;
    } else {
      errors.value.push("Ein Fehler ist aufgetreten.");
    }
  } catch (error) {
    errors.value.push("Ein Fehler ist aufgetreten.");
    loading.value = false;
  }
}

async function openDialog(orgaId: string) {
  organizationId.value = orgaId;
  email.value = "";
  success.value = false;
  visible.value = true;
  errors.value = [];
  emailError.value = "";
}

defineExpose({
  openDialog,
});
</script>

<template>
  <Dialog modal v-model:visible="visible" :header="t('organizations.inviteUser')">
    <div>
      <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
        <EnvelopeIcon aria-hidden="true" class="size-6 text-green-600" />
      </div>
      <div class="mt-3 text-center sm:mt-5">
        <DialogTitle as="h3" class="text-base font-semibold text-gray-900">
          {{ t("organizations.inviteUser") }}
        </DialogTitle>
        <div v-if="success" class="mt-3">
          <div class="text-sm text-green-600">
            {{ t("organizations.inviteUserSuccess") }}
          </div>
          <button
            class="mt-3 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-hidden"
            type="button"
            @click="visible = false"
          >
            {{ t("common.close") }}
          </button>
        </div>
        <div v-else class="mt-3">
          <form v-show="!loading" class="flex flex-col gap-4" @submit.prevent="inviteUser">
            <div v-if="errors.length" class="flex flex-col gap-1">
              <Message v-for="error in errors" :key="error" severity="error" :closable="false">
                {{ error }}
              </Message>
            </div>

            <div class="flex flex-col gap-2">
              <label for="email" class="block text-sm font-medium text-gray-700">
                {{ t("common.form.email.label") }}
              </label>
              <InputText
                id="email"
                v-model="email"
                type="text"
                :invalid="!!emailError"
                class="w-full"
                :aria-describedby="emailError ? 'email-error' : 'email-help'"
              />
              <small v-if="emailError" id="email-error" class="text-red-600">{{
                emailError
              }}</small>
            </div>

            <Button
              :label="t('organizations.invite')"
              type="submit"
              :loading="loading"
              class="w-full"
            />
          </form>
          <RingLoader v-show="loading" class="mx-auto w-fit" />
        </div>
      </div>
    </div>
  </Dialog>
</template>
