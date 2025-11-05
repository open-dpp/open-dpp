<script setup lang="ts">
import { Galleria, Image } from "primevue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import emptyState from "../../assets/empty-state.png";
import { useProductPassportStore } from "../../stores/product-passport";

const productPassportStore = useProductPassportStore();

const productPassport = computed(() => productPassportStore.productPassport);
const { t } = useI18n();
</script>

<template>
  <div class="grid grid-cols-3 grid-rows-1 gap-5">
    <div class="order-2 md:order-1 col-span-3 md:col-span-2 bg-white shadow-sm">
      <div id="product-details" class="px-4 py-6 sm:px-6">
        <h3 class="text-base/7 font-semibold text-gray-900">
          {{ t("presentation.productDetails") }}
        </h3>
        <p class="mt-1 max-w-2xl text-sm/6 text-gray-500">
          {{ t("presentation.productDetailsDesc") }}
        </p>
      </div>
      <div v-if="productPassport" class="border-t border-gray-100">
        <dl class="divide-y divide-gray-100">
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-900">
              {{ t("common.identification") }}
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ productPassport.id }}
            </dd>
            <dt class="text-sm font-medium text-gray-900">
              {{ t("common.name") }}
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ productPassport.name }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
    <div class="order-1 md:order-2 col-span-3 md:col-span-1 w-full max-w-80 mx-auto">
      <Galleria
        class="mx-auto"
        :value="
          productPassportStore.mediaFiles.length > 0
            ? productPassportStore.mediaFiles
            : [{ url: emptyState }]
        "
        :num-visible="productPassportStore.mediaFiles.length > 0 ? 5 : 0"
        :show-thumbnails="productPassportStore.mediaFiles.length > 0"
        thumbnails-position="bottom"
      >
        <template #item="slotProps">
          <Image :src="slotProps.item.url" alt="Image" width="100%" preview />
        </template>
        <template #thumbnail="slotProps">
          <Image :src="slotProps.item.url" width="40px" />
        </template>
      </Galleria>
    </div>
  </div>
</template>
