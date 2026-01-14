<script lang="ts" setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { useDraftSidebarStore } from "../../stores/draftSidebar";

const draftSidebarStore = useDraftSidebarStore();
</script>

<template>
  <TransitionRoot :show="draftSidebarStore.isOpen" as="oldTemplate">
    <Dialog class="relative z-20" @close="draftSidebarStore.close">
      <div class="fixed inset-0" />

      <div class="fixed inset-0 overflow-hidden">
        <div class="absolute inset-0 overflow-hidden">
          <div
            class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16 pt-12"
          >
            <TransitionChild
              as="oldTemplate"
              enter="transform transition ease-in-out duration-500 sm:duration-700"
              enter-from="translate-x-full"
              enter-to="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700"
              leave-from="translate-x-0"
              leave-to="translate-x-full"
            >
              <DialogPanel class="pointer-events-auto w-screen max-w-md">
                <div
                  class="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
                >
                  <div class="bg-indigo-700 px-4 py-6 sm:px-6">
                    <div class="flex items-center justify-between">
                      <DialogTitle class="text-base font-semibold text-white">
                        {{
                          draftSidebarStore.title
                        }}
                      </DialogTitle>
                      <div class="ml-3 flex h-7 items-center">
                        <button
                          class="relative rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          type="button"
                          @click="draftSidebarStore.close"
                        >
                          <span class="absolute -inset-2.5" />
                          <span class="sr-only">Close panel</span>
                          <XMarkIcon aria-hidden="true" class="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                    <div class="mt-1">
                      <p class="text-sm text-indigo-300">
                        {{ draftSidebarStore.subTitle }}
                      </p>
                    </div>
                  </div>
                  <component
                    :is="draftSidebarStore.content"
                    v-if="draftSidebarStore.content"
                    v-bind="draftSidebarStore.contentProps"
                  />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
