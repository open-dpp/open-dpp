<script lang="ts" setup>
import type { FunctionalComponent } from "vue";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";

defineProps<{
  icon: FunctionalComponent;
  title?: string;
  items: Array<{
    icon?: FunctionalComponent;
    text: string;
  }>;
  position?: "above" | "below";
}>();

const emits = defineEmits<{
  (e: "itemClicked", index: number): void;
}>();
</script>

<template>
  <Menu as="div" class="relative inline-block text-left">
    <div class="h-full">
      <MenuButton
        class="h-full flex items-center rounded-full text-gray-600 hover:text-black focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 px-3 py-1 hover:cursor-pointer"
        @click.stop
      >
        <span class="sr-only">Open options</span>
        <component :is="icon" aria-hidden="true" class="size-5" />
      </MenuButton>
    </div>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems
        class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden" :class="[
          position === 'above' ? 'bottom-full' : 'top-full',
        ]"
      >
        <div class="px-4 py-2 text-xl font-bold">
          {{ title }}
        </div>
        <div class="py-1">
          <MenuItem
            v-for="(item, index) in items"
            :key="index"
            v-slot="{ active }"
          >
            <button
              class="group flex items-center px-4 py-2 text-sm w-full hover:cursor-pointer" :class="[
                active
                  ? 'bg-gray-100 text-gray-900 outline-hidden'
                  : 'text-gray-700',
              ]"
              @click="emits('itemClicked', index)"
            >
              <component
                :is="item.icon"
                v-if="item.icon"
                class="mr-3 size-5 text-gray-400" :class="[
                  active ? 'text-gray-500' : '',
                ]"
                aria-hidden="true"
              />
              {{ item.text }}
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>
