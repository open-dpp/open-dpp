<template>
  <section class="pt-5">
    <div
      class="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow-sm max-w-xl"
    >
      <div class="px-4 py-5 sm:px-6">{{ t('common.presentationMode') }}</div>
      <div class="px-4 py-5 sm:p-6">
        <canvas ref="canvas" class="mx-auto h-12 w-12 text-gray-400" />
      </div>
      <div class="flex flex-row gap-1 px-4 py-4 sm:px-6 text-blue-600">
        <router-link :to="props.link" class="mt-2 text-sm font-semibold"
          >{{ props.link }}
        </router-link>
        <ArrowTopRightOnSquareIcon class="w-5 mt-auto" />
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { toCanvas } from 'qrcode';
import { onMounted, ref } from 'vue';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/16/solid';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const canvas = ref<HTMLCanvasElement>();
const props = defineProps<{
  content: string;
  link: string;
}>();
onMounted(async () => {
  toCanvas(canvas.value, props.content, () => {});
});
</script>
