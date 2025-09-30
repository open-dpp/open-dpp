<template>
  <div class="flex flex-col gap-3">
    <div class="overflow-hidden bg-white shadow-sm sm:rounded-lg">
      <div class="px-4 py-6 sm:px-6">
        <h3 class="text-base/7 font-semibold text-gray-900">
          {{ t('models.info') }}
        </h3>
      </div>
      <div
        v-if="modelFormStore.productPassport"
        class="border-t border-gray-100"
      >
        <dl class="divide-y divide-gray-100">
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-900">
              {{ t('models.form.id') }}
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ modelFormStore.getUUID() }}
            </dd>
          </div>
          <div class="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-900">
              {{ t('models.form.name.label') }}
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ modelFormStore.productPassport.name }}
            </dd>
          </div>
        </dl>
      </div>
    </div>
    <PassportForm
      v-if="modelFormStore.productPassport && !modelFormStore.fetchInFlight"
    />
  </div>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { watch } from 'vue';
import PassportForm from '../../components/passport/PassportForm.vue';
import { usePassportFormStore } from '../../stores/passport.form';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const route = useRoute();
const modelFormStore = usePassportFormStore();

watch(
  () => route.params.modelId, // The store property to watch
  async () => {
    await modelFormStore.fetchModel(String(route.params.modelId));
  },
  { immediate: true, deep: true }, // Optional: to run the watcher immediately when the component mounts
);
</script>
