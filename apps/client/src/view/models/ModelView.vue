<script lang="ts" setup>
import { Button, Galleria, Image } from "primevue";
import { watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import emptyState from "../../assets/empty-state.png";
import PassportForm from "../../components/passport-old/PassportForm.vue";
import { usePassportFormStore } from "../../stores/passport.form";

const { t } = useI18n();
const route = useRoute();
const modelFormStore = usePassportFormStore();

watch(
  () => route.params.modelId, // The store property to watch
  async () => {
    await modelFormStore.fetchModel(String(route.params.modelId));
    await modelFormStore.loadMedia();
  },
  { immediate: true }, // Optional: to run the watcher immediately when the component mounts
);
</script>

<template>
  <div>
    <div class="flex flex-col pt-4 gap-3">
      <div class="flex gap-3">
        <div class="flex-1 overflow-hidden bg-white shadow-sm sm:rounded-lg">
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
        <Galleria :value="modelFormStore.mediaFiles.length > 0 ? modelFormStore.mediaFiles : [{ url: emptyState }]" :num-visible="modelFormStore.mediaFiles.length > 0 ? 5 : 0" :show-thumbnails="modelFormStore.mediaFiles.length > 0" thumbnails-position="bottom" container-style="max-width: 340px">
          <template #header>
            <div class="p-2">
              <Button v-slot="slotProps" as-child>
                <RouterLink :to="`${route.params.modelId}/media`" :class="slotProps.class">
                  {{ modelFormStore.mediaFiles.length > 0 ? t('common.edit') : t('common.add') }}
                </RouterLink>
              </Button>
            </div>
          </template>
          <template #item="slotProps">
            <Image :src="slotProps.item.url" alt="Image" width="100%" preview />
          </template>
          <template #thumbnail="slotProps">
            <Image :src="slotProps.item.url" width="40px" />
          </template>
        </Galleria>
      </div>
      <PassportForm
        v-if="modelFormStore.productPassport && !modelFormStore.fetchInFlight"
      />
    </div>
  </div>
</template>
