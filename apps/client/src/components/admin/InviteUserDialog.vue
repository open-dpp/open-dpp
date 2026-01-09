<script lang="ts" setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { EnvelopeIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { authClient } from "../../auth-client.ts";
import RingLoader from "../RingLoader.vue";

const emit = defineEmits<{
  (e: "close"): void;
  (e: "invitedUser"): void;
}>();
const { t } = useI18n();
const loading = ref<boolean>(false);
const errors = ref<Array<string>>([]);
const success = ref<boolean>(false);
const email = ref("");
const password = ref("");
const firstName = ref("");
const lastName = ref("");

async function inviteUser() {
  success.value = false;
  errors.value = [];

  try {
    loading.value = true;
    const fullName = `${firstName.value} ${lastName.value}`;
    const { error } = await authClient.admin.createUser({
      email: email.value,
      password: password.value,
      name: fullName,
      role: "admin",
      data: {
        firstName: firstName.value,
        lastName: lastName.value,
        emailVerified: true,
      },
    });
    loading.value = false;
    if (!error) {
      success.value = true;
      emit("invitedUser");
      email.value = "";
      password.value = "";
      firstName.value = "";
      lastName.value = "";
      errors.value = [];
      loading.value = false;
    }
    else {
      errors.value.push(t("common.errorOccured"));
    }
  }
  catch (error) {
    console.error(error);
    errors.value.push(t("common.errorOccured"));
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
                  class="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100"
                >
                  <EnvelopeIcon
                    aria-hidden="true"
                    class="size-6 text-green-600"
                  />
                </div>
                <div class="mt-3 text-center sm:mt-5">
                  <DialogTitle
                    as="h3"
                    class="text-base font-semibold text-gray-900"
                  >
                    {{ t('organizations.admin.inviteUserDialog.title') }}
                  </DialogTitle>
                  <div v-if="success" class="mt-3">
                    <div class="text-sm text-green-600">
                      {{ t('organizations.admin.inviteUserDialog.success') }}
                    </div>
                    <button
                      class="mt-3 rounded-md bg-green-600 text-white px-3 py-2 text-sm font-semibold shadow-xs hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      type="button"
                      @click="emit('close')"
                    >
                      {{ t('common.close') }}
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
                          {{ t('common.form.email.label') }}
                        </label>
                        <InputText
                          id="email"
                          v-model="email"
                          type="text"
                          class="w-full"
                        />
                      </div>

                      <div class="flex flex-col gap-2">
                        <label for="password" class="block text-sm font-medium text-gray-700">
                          {{ t('common.form.password.label') }}
                        </label>
                        <InputText
                          id="password"
                          v-model="password"
                          type="password"
                          class="w-full"
                        />
                      </div>

                      <div class="flex flex-col gap-2">
                        <label for="firstName" class="block text-sm font-medium text-gray-700">
                          {{ t('user.firstName') }}
                        </label>
                        <InputText
                          id="firstName"
                          v-model="firstName"
                          type="text"
                          class="w-full"
                        />
                      </div>

                      <div class="flex flex-col gap-2">
                        <label for="lastName" class="block text-sm font-medium text-gray-700">
                          {{ t('user.lastName') }}
                        </label>
                        <InputText
                          id="lastName"
                          v-model="lastName"
                          type="text"
                          class="w-full"
                        />
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
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
