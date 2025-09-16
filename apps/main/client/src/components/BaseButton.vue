<template>
  <button
    :class="[
      colorClasses,
      'm-2 block rounded-md px-3 py-1.5 text-center text-sm/6 font-semibold shadow-xs focus-visible:outline focus-visible:outline-offset-2',
      props.disabled ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer',
    ]"
    v-bind="props"
    @click="emits('click', $event)"
  >
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  variant?: "primary" | "error";
}>();

const colorClasses = computed(() => {
  const defaultColors = "bg-white text-gray-900 hover:bg-gray-50";
  switch (props.variant) {
    case "primary":
      return "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600 text-white";
    case "error":
      return "bg-red-600 hover:bg-red-500 focus-visible:outline-red-600 text-white";
    default:
      return defaultColors;
  }
});
const emits = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>
