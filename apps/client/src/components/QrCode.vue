<script lang="ts" setup>
import { toCanvas } from "qrcode";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  link: string;
  size: number;
}>();
const canvas = ref<HTMLCanvasElement>();
watch(
  () => [props.link, props.size] as const,
  async () => {
    if (!canvas.value) return;
    canvas.value.width = props.size;
    canvas.value.height = props.size;
    await toCanvas(canvas.value, props.link, { width: props.size, margin: 1 });
  },
  { immediate: true },
);
</script>

<template>
  <canvas ref="canvas" class="block w-full text-gray-400" :aria-label="link" />
</template>
