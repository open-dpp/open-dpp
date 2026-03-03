<script setup lang="ts">
import type { FieldView } from "../../lib/field-view";
import { useRouter } from "vue-router";

const props = defineProps<{ fieldView: FieldView }>();

const router = useRouter();

async function onLinkClick() {
  await router.push(`/presentation/${props.fieldView.value as string}`);
}
</script>

<template>
  <button
    type="button"
    class="text-sm cursor-pointer font-medium text-blue-600 hover:text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    @click="onLinkClick"
  >
    Aufrufen
  </button>
</template>
