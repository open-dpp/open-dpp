<script lang="ts" setup>
import { watch } from "vue";
import { useRoute } from "vue-router";
import PassportForm from "../../components/passport/PassportForm.vue";
import { usePassportFormStore } from "../../stores/passport.form";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();
const productPassportStore = usePassportFormStore();

watch(
  () => [route.params.modelId, route.params.itemId], // The store property to watch
  async () => {
    await productPassportStore.fetchItem(
      String(route.params.modelId),
      String(route.params.itemId),
    );
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="overflow-hidden bg-white shadow-sm sm:rounded-lg">
      <div class="px-4 py-6 sm:px-6">
        <h3 class="text-base/7 font-semibold text-gray-900">
          {{ t('items.info') }}
        </h3>
      </div>
      <div
        v-if="productPassportStore.productPassport"
        class="border-t border-gray-100"
      >
        <dl class="divide-y divide-gray-100">
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-900">
              ID
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ productPassportStore.getUUID() }}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-900">
              Name
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ productPassportStore.productPassport.name }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
    <PassportForm
      v-if="
        productPassportStore.productPassport
          && !productPassportStore.fetchInFlight
      "
    />
  </div>
</template>
