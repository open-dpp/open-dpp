<script lang="ts" setup>
import { toCanvas } from "qrcode";
import { onMounted, ref, watch } from "vue";

const props = defineProps<{
  link: string;
  size: number;
}>();
const canvas = ref<HTMLCanvasElement>();
watch(
  [() => props.link, () => props.size],
  async ([newLink, newSize]) => {
    await generateQRCode(newLink, newSize);
  },
  { immediate: false },
);

async function generateQRCode(newLink: string, newSize: number) {
  if (!canvas.value) return;
  canvas.value.width = newSize;
  canvas.value.height = newSize;
  await toCanvas(canvas.value, newLink, { width: newSize, margin: 1 });
}

onMounted(async () => {
  await generateQRCode(props.link, props.size);
});
</script>

<template>
  <canvas ref="canvas" class="block w-full text-gray-400" :aria-label="link" />
</template>
