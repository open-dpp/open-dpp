<script lang="ts" setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { EnvelopeIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../../lib/api-client";
import RingLoader from "../RingLoader.vue";

const props = defineProps<{
  organizationId: string;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "invitedUser"): void;
}>();
const { t } = useI18n();
const loading = ref<boolean>(false);
const errors = ref<Array<string>>([]);
const success = ref<boolean>(false);

async function inviteUser(fields: { email: string }) {
  success.value = false;
  errors.value = [];
  try {
    if (fields.email) {
      loading.value = true;
      const response = await apiClient.dpp.organizations.inviteUser(
        fields.email,
        props.organizationId,
      );
      loading.value = false;
      if (response.status === 201) {
        success.value = true;
        emit("invitedUser");
      }
      else {
        errors.value.push("Ein Fehler ist aufgetreten.");
      }
    }
    else {
      errors.value.push("Bitte geben Sie eine E-Mail Adresse ein.");
    }
  }
  catch (error) {
    console.error(error);
    errors.value.push("Ein Fehler ist aufgetreten.");
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
                    {{ t('organizations.inviteUser') }}
                  </DialogTitle>
                  <div v-if="success" class="mt-3">
                    <div class="text-sm text-green-600">
                      {{ t('organizations.inviteUserSuccess') }}
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
                    <FormKit
                      v-show="!loading"
                      :actions="false"
                      :errors="errors"
                      type="form"
                      @submit="inviteUser"
                    >
                      <FormKit
                        :help="t('common.form.email.help')"
                        :label="t('common.form.email.label')"
                        name="email"
                        type="text"
                        validation="required|email"
                      />
                      <FormKit
                        :disabled="loading"
                        :label="t('organizations.invite')"
                        type="submit"
                      />
                    </FormKit>
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
