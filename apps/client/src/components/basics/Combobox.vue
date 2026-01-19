<script setup lang="ts">
import type { Option } from "../../lib/combobox";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxLabel,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/vue";
import { ChevronDownIcon } from "@heroicons/vue/20/solid";
import { computed, ref } from "vue";

const props = defineProps<{
  label: string;
  options: Option[];
  labelPosition?: "top" | "left"; // new prop for label position
}>();

const selectedOption = defineModel<Option | null>();

const query = ref("");
const filteredOptions = computed(() =>
  query.value === ""
    ? props.options
    : props.options.filter((option) => {
        return option.label.toLowerCase().includes(query.value.toLowerCase());
      }),
);
const queryOptions = computed(() => {
  return query.value === "" ? null : { id: null, name: query.value };
});
</script>

<template>
  <Combobox v-model="selectedOption" as="div" @update:model-value="query = ''">
    <div
      class="flex" :class="[
        props.labelPosition === 'left'
          ? 'flex-row items-center gap-2'
          : 'flex-col gap-2',
      ]"
    >
      <ComboboxLabel
        class="block text-sm/6 font-medium text-gray-900 dark:text-white'"
      >
        {{ props.label }}
      </ComboboxLabel>
      <div class="relative">
        <ComboboxInput
          class="block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
          :display-value="(option) => (option as Option | null)?.label ?? ''"
          @change="query = $event.target.value"
          @blur="query = ''"
        />
        <ComboboxButton
          class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden"
          @click="query = ''"
        >
          <ChevronDownIcon class="size-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        <transition
          leave-active-class="transition ease-in duration-100"
          leave-from-class=""
          leave-to-class="opacity-0"
        >
          <ComboboxOptions
            v-if="filteredOptions.length > 0 || query.length > 0"
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-black/5 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
          >
            <ComboboxOption
              v-if="queryOptions"
              v-slot="{ active }"
              :value="queryOptions"
              as="oldTemplate"
            >
              <li
                class="relative cursor-default px-3 py-2 select-none" :class="[
                  active
                    ? 'bg-indigo-600 text-white outline-hidden dark:bg-indigo-500'
                    : 'text-gray-900 dark:text-white',
                ]"
              >
                <span class="block truncate">
                  {{ query }}
                </span>
              </li>
            </ComboboxOption>
            <ComboboxOption
              v-for="option in filteredOptions"
              :key="option.id"
              v-slot="{ active }"
              :value="option"
              as="oldTemplate"
            >
              <li
                class="relative cursor-default px-3 py-2 select-none" :class="[
                  active
                    ? 'bg-indigo-600 text-white outline-hidden dark:bg-indigo-500'
                    : 'text-gray-900 dark:text-white',
                ]"
              >
                <span class="block truncate">
                  {{ option.label }}
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </transition>
      </div>
    </div>
  </Combobox>
</template>
