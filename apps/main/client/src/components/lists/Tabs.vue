<template>
  <div>
    <div class="grid grid-cols-1 sm:hidden">
      <!-- Use an "onChange" listener to redirect the user to the selected tab URL. -->
      <select
        aria-label="Select a tab"
        class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
        @change="
          (event) =>
            emits('change', (event.target as HTMLSelectElement).selectedIndex)
        "
      >
        <option
          v-for="(tab, index) in tabs"
          :key="index"
          :selected="index === value"
        >
          {{ tab }}
        </option>
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
      />
    </div>
    <div class="hidden sm:block">
      <nav
        aria-label="Tabs"
        class="isolate flex divide-x divide-gray-200 rounded-lg shadow-sm"
      >
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          :aria-current="index === value ? 'page' : undefined"
          :class="[
            index === value
              ? 'text-gray-900'
              : 'text-gray-500 hover:text-gray-700',
            index === 0 ? 'rounded-l-lg' : '',
            index === tabs.length - 1 ? 'rounded-r-lg' : '',
            'group relative min-w-0 flex-1 overflow-hidden bg-white px-4 py-4 text-center text-sm font-medium hover:bg-gray-50 focus:z-10',
          ]"
          class="hover:cursor-pointer"
          type="button"
          @click="emits('change', index)"
        >
          <span>{{ tab }}</span>
          <span
            :class="[
              index === value ? 'bg-indigo-500' : 'bg-transparent',
              'absolute inset-x-0 bottom-0 h-0.5',
            ]"
            aria-hidden="true"
          />
        </button>
      </nav>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ChevronDownIcon } from "@heroicons/vue/16/solid";

defineProps<{
  tabs: Array<string>;
  value: number;
}>();

const emits = defineEmits<{
  (e: "change", index: number): void;
}>();
</script>
