<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/20/solid";
import { VisibilityLevel } from "@open-dpp/api-client";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const emits = defineEmits<{
  (e: "onPublish", visibility: VisibilityLevel): void;
}>();
const { t } = useI18n();
const selectedVisibility = ref<VisibilityLevel>(VisibilityLevel.PRIVATE);

const items: { name: string; visibility: VisibilityLevel }[] = [
  {
    name: t("draft.visibility.private"),
    visibility: VisibilityLevel.PRIVATE,
  },
  { name: t("draft.visibility.public"), visibility: VisibilityLevel.PUBLIC },
];
</script>

<template>
  <div class="inline-flex rounded-md shadow-sm">
    <button
      type="button"
      class="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold border-r-2 border-white bg-indigo-600 text-white hover:bg-indigo-500"
      @click="emits('onPublish', selectedVisibility)"
    >
      {{ t('draft.publish') }}
    </button>
    <Menu as="div" class="relative -ml-px block">
      <MenuButton
        data-cy="selectVisibility"
        class="relative inline-flex items-center rounded-r-md bg-indigo-600 px-2 py-2 text-white hover:bg-indigo-500 focus:z-10"
      >
        <span class="sr-only">Open options</span>
        <ChevronDownIcon class="size-5" aria-hidden="true" />
      </MenuButton>
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <MenuItems
          class="absolute right-0 z-12 -mr-1 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          <div class="py-1">
            <MenuItem
              v-for="item in items"
              :key="item.name"
              @click="selectedVisibility = item.visibility"
            >
              <a
                href="#"
                class="block px-4 py-2 text-sm" :class="[
                  item.visibility === selectedVisibility
                    ? 'bg-gray-100 text-gray-900 outline-none'
                    : 'text-gray-700',
                ]"
              >
                {{ item.name }}
              </a>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </div>
</template>
