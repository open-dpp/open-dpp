<template>
  <TransitionRoot :show="modelDialogStore.isOpen" as="template">
    <Dialog class="relative z-20" @close="modelDialogStore.close">
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
              class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
            >
              <div class="sm:flex sm:items-start">
                <div
                  class="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10"
                >
                  <ExclamationTriangleIcon
                    v-if="modelDialogStore.content.type === 'warning'"
                    aria-hidden="true"
                    class="size-6 text-red-600"
                  />
                  <InformationCircleIcon
                    v-else
                    aria-hidden="true"
                    class="size-6 text-indigo-600"
                  />
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle
                    as="h3"
                    class="text-base font-semibold text-gray-900"
                    >{{ modelDialogStore.content.title }}
                  </DialogTitle>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      {{ modelDialogStore.content.description }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <BaseButton
                  :variant="
                    modelDialogStore.content.type === 'warning'
                      ? 'error'
                      : 'primary'
                  "
                  type="button"
                  @click="modelDialogStore.confirm"
                >
                  {{ t('common.submit') }}
                </BaseButton>
                <BaseButton type="button" @click="modelDialogStore.cancel">
                  {{ t('common.abort') }}
                </BaseButton>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script lang="ts" setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline';
import { useModelDialogStore } from '../stores/modal.dialog';
import BaseButton from './BaseButton.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const modelDialogStore = useModelDialogStore();
</script>
