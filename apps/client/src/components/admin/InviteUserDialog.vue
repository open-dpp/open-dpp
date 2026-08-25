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

const { t } = useI18n();
const loading = ref(false);
const errors = ref<Array<string>>([]);
const success = ref(false);
const visible = ref(false);
const email = ref("");
const firstName = ref("");
const lastName = ref("");
const emailError = ref("");

const emit = defineEmits<{
  success: [];
}>();

async function openInviteDialog() {
  loading.value = false;
  errors.value = [];
  success.value = false;
  email.value = "";
  emailError.value = "";
  firstName.value = "";
  lastName.value = "";
  visible.value = true;
}

async function inviteUser() {
  success.value = false;
  errors.value = [];
  emailError.value = "";

  const emailSchema = z.email();
  const result = emailSchema.safeParse(email.value);

  if (!result.success) {
    emailError.value = t("common.form.email.invalid");
    return;
  }

  try {
    loading.value = true;
    const response = await apiClient.dpp.users.create({
      email: email.value,
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
    });
    loading.value = false;
    if (response.status === 201) {
      success.value = true;
      email.value = "";
      firstName.value = "";
      lastName.value = "";
      errors.value = [];
      visible.value = false;

      emit("success");
    } else {
      errors.value.push(t("common.errorOccurred"));
    }
  } catch (error) {
    errors.value.push(t("common.errorOccurred"));
    loading.value = false;
  }
}

defineExpose({
  openInviteDialog,
});
</script>

<template>
  <Dialog v-model:visible="visible" modal :header="t('organizations.admin.inviteUserDialog.title')">
    <div>
      <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100">
        <EnvelopeIcon aria-hidden="true" class="size-6 text-green-600" />
      </div>
      <div class="mt-3 text-center sm:mt-5">
        <div v-if="success" class="mt-3">
          <div class="text-sm text-green-600">
            {{ t("organizations.admin.inviteUserDialog.success") }}
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

            <div class="flex flex-col gap-2">
              <label for="firstName" class="block text-sm font-medium text-gray-700">
                {{ t("user.firstName") }}
              </label>
              <InputText id="firstName" v-model="firstName" type="text" class="w-full" />
            </div>

            <div class="flex flex-col gap-2">
              <label for="lastName" class="block text-sm font-medium text-gray-700">
                {{ t("user.lastName") }}
              </label>
              <InputText id="lastName" v-model="lastName" type="text" class="w-full" />
            </div>

            <Button
              :label="t('organizations.admin.inviteUserDialog.create')"
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
