<script setup lang="ts">
import type { Option } from "../../lib/combobox";
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import { ChevronUpDownIcon } from "@heroicons/vue/16/solid";
import { CheckIcon } from "@heroicons/vue/20/solid";

const props = defineProps<{
  dataCy?: string;
  label: string;
  options: Option[];
  labelPosition?: "top" | "left"; // new prop for label position
}>();

const selectedOption = defineModel<Option | null>();
</script>

<template>
  <Listbox v-model="selectedOption" :data-cy="props.dataCy" as="div">
    <div
      class="flex"
      :class="[
        props.labelPosition === 'left'
          ? 'flex-row items-center gap-2'
          : 'flex-col gap-2',
      ]"
    >
      <ListboxLabel
        class="block text-sm/6 font-medium text-gray-900 dark:text-white"
      >
        {{ props.label }}
      </ListboxLabel>
      <div class="relative">
        <ListboxButton
          class="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:focus-visible:outline-indigo-500"
        >
          <span class="col-start-1 row-start-1 truncate pr-6">{{
            selectedOption?.label
          }}</span>
          <ChevronUpDownIcon
            class="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400"
            aria-hidden="true"
          />
        </ListboxButton>
        <transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class=""
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
          >
            <ListboxOption
              v-for="option in props.options"
              :key="option.id"
              v-slot="{ active, selected }"
              as="template"
              :value="option"
            >
              <li
                class="relative cursor-default py-2 pr-9 pl-3 select-none"
                :class="[
                  active
                    ? 'bg-indigo-600 text-white outline-hidden dark:bg-indigo-500'
                    : 'text-gray-900 dark:text-white',
                ]"
              >
                <span
                  class="block truncate"
                  :class="[selected ? 'font-semibold' : 'font-normal']"
                >{{ option.label }}</span>
                <span
                  v-if="selected"
                  class="absolute inset-y-0 right-0 flex items-center pr-4"
                  :class="[
                    active
                      ? 'text-white'
                      : 'text-indigo-600 dark:text-indigo-400',
                  ]"
                >
                  <CheckIcon class="size-5" aria-hidden="true" />
                </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </div>
  </Listbox>
</template>
