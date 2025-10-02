<script lang="ts" setup>
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/vue/20/solid";
import { computed } from "vue";

const props = defineProps<{
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}>();

const emits = defineEmits<{
  (e: "pageChanged", page: number): void;
}>();

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage);
});

const actions = computed<
  Array<{
    label: string;
    page: number;
  }>
>(() => {
  if (totalPages.value === 0) {
    return [
      {
        label: String(props.currentPage),
        page: props.currentPage,
      },
    ];
  }

  const result: Array<{ label: string; page: number }> = [];
  const maxPagesToShow = 5; // Current page + 2 before + 2 after

  // Calculate start and end page numbers
  let startPage = Math.max(0, props.currentPage - 2);
  let endPage = Math.min(totalPages.value - 1, props.currentPage + 2);

  // Adjust if we're at the beginning or end
  if (props.currentPage < 2) {
    // If we're at the beginning, show more pages after
    endPage = Math.min(totalPages.value - 1, startPage + maxPagesToShow - 1);
  }
  else if (props.currentPage > totalPages.value - 3) {
    // If we're at the end, show more pages before
    startPage = Math.max(0, endPage - maxPagesToShow + 1);
  }

  // Create page objects
  for (let i = startPage; i <= endPage; i++) {
    result.push({
      label: String(i),
      page: i,
    });
  }

  return result;
});
</script>

<template>
  <div
    class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
  >
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        @click="
          currentPage === 0 ? () => {} : emits('pageChanged', currentPage - 1)
        "
      >
        Previous
      </button>
      <button
        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        @click="
          currentPage === totalPages - 1
            ? () => {}
            : emits('pageChanged', currentPage + 1)
        "
      >
        Next
      </button>
    </div>
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700">
          Zeigt
          {{ ' ' }}
          <span class="font-medium">{{ currentPage * itemsPerPage + 1 }}</span>
          {{ ' ' }}
          bis
          {{ ' ' }}
          <span class="font-medium">{{
            Math.min((currentPage + 1) * itemsPerPage, totalItems)
          }}</span>
          {{ ' ' }}
          von
          {{ ' ' }}
          <span class="font-medium">{{ totalItems }}</span>
          {{ ' ' }}
          Elementen
        </p>
      </div>
      <div>
        <nav
          aria-label="Pagination"
          class="isolate inline-flex -space-x-px rounded-md shadow-xs"
        >
          <button
            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 hover:cursor-pointer"
            @click="
              currentPage === 0
                ? () => {}
                : emits('pageChanged', currentPage - 1)
            "
          >
            <span class="sr-only">Previous</span>
            <ChevronLeftIcon aria-hidden="true" class="size-5" />
          </button>
          <button
            v-for="(action, index) in actions"
            :key="index"
            :aria-current="action.page === currentPage ? 'page' : undefined"
            :class="{
              'bg-[#6BAD87] text-white focus-visible:outline-[#6BAD87]':
                action.page === currentPage,
              'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50':
                action.page !== currentPage,
            }"
            class="relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 hover:cursor-pointer"
            @click="emits('pageChanged', action.page)"
          >
            {{ action.page + 1 }}
          </button>
          <button
            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 hover:cursor-pointer"
            @click="
              currentPage === totalPages - 1
                ? () => {}
                : emits('pageChanged', currentPage + 1)
            "
          >
            <span class="sr-only">Next</span>
            <ChevronRightIcon aria-hidden="true" class="size-5" />
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>
