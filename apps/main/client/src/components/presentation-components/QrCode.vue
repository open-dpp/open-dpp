<template>
  <div
    class="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm max-w-xl"
  >
    <div class="px-4 py-5 sm:p-6">
      <canvas ref="canvas" class="mx-auto md:h-12 md:w-12 text-gray-400" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toCanvas } from "qrcode";
import { onMounted, ref } from "vue";

const canvas = ref<HTMLCanvasElement>();
const props = defineProps<{
  url: string;
}>();
onMounted(async () => {
  toCanvas(canvas.value, props.url, () => {});
});
</script>
