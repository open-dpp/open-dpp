<script setup lang="ts">
import { computed } from "vue";
import { useProductPassportStore } from "../../stores/product-passport";
import QrCode from "./QrCode.vue";
import { useI18n } from 'vue-i18n';

const productPassportStore = useProductPassportStore();

const productPassport = computed(() => productPassportStore.productPassport);
const { t } = useI18n();

const url = computed(() => {
  const href = window.location.href;
  if (!href.includes("#")) {
    return href;
  }
  return href.substring(0, href.lastIndexOf("#"));
});
</script>

<template>
  <div class="flex flex-row gap-5">
    <div class="grow bg-white shadow-sm">
      <div class="px-4 py-6 sm:px-6" id="product-details">
        <h3 class="text-base/7 font-semibold text-gray-900">
          {{ t('presentation.productDetails') }}
        </h3>
        <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">
          {{ t('presentation.productDetailsDesc') }}
        </p>
      </div>
      <div v-if="productPassport" class="border-t border-gray-100">
        <dl class="divide-y divide-gray-100">
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-900">
              {{ t('common.identification') }}
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ productPassport.id }}
            </dd>
            <dt class="text-sm font-medium text-gray-900">
              {{ t('common.name') }}
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ productPassport.name }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
    <div class="shrink mx-auto my-auto h-full">
      <QrCode :url="url" />
    </div>
  </div>
</template>
