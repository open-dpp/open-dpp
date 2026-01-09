<script setup lang="ts">
const props = defineProps<{
  title: string;
  description: string;
  creationLink?: string;
  creationLabel?: string;
}>();

const emits = defineEmits<{
  (e: "add"): void;
}>();
</script>

<template>
  <div class="sm:flex sm:items-center">
    <div class="sm:flex-auto">
      <h1 class="text-base font-semibold text-gray-900">
        {{ props.title }}
      </h1>
      <p class="mt-2 text-sm text-gray-700">
        {{ props.description }}
      </p>
    </div>
    <div v-if="creationLabel" class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
      <component
        :is="creationLink ? 'router-link' : 'button'"
        :to="creationLink"
        class="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        v-bind="creationLink ? {} : { type: 'button' }"
        @click="!creationLink ? emits('add') : null"
      >
        {{ creationLabel }}
      </component>
    </div>
  </div>
</template>
