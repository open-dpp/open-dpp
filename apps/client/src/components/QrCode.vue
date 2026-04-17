<script lang="ts" setup>
import { toCanvas } from "qrcode";
import { onMounted, ref } from "vue";

const props = defineProps<{
  link: string;
  size: number;
}>();
const canvas = ref<HTMLCanvasElement>();
onMounted(async () => {
  if (!canvas.value) return;

  canvas.value.width = props.size;
  canvas.value.height = props.size;
  toCanvas(canvas.value, props.link, { width: props.size, margin: 1 }, () => {});
});
</script>

<template>
  <canvas ref="canvas" class="block w-full text-gray-400" />
</template>
