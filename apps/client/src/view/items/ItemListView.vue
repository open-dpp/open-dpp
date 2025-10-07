<script lang="ts" setup>
import type { ItemDto } from "@open-dpp/api-client";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ItemList from "../../components/items/ItemList.vue";
import apiClient from "../../lib/api-client";
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();
const buttonLabel = computed(() => t('items.new'));

const items = ref<ItemDto[]>([]);

async function fetchItems() {
  const response = await apiClient.dpp.items.getAll(
    String(route.params.modelId),
  );
  items.value = response.data;
}

async function onAdd() {
  await apiClient.dpp.items.create(String(route.params.modelId));
  await fetchItems();
}

onMounted(async () => {
  await fetchItems();
});
</script>

<template>
  <section>
    <div class="flex flex-col gap-3 p-3">
      <ItemList v-if="items.length > 0" :items="items" @add="onAdd" />
      <button
        v-else
        class="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        type="button"
        @click="onAdd"
      >
        <svg
          aria-hidden="true"
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 48 48"
        >
          <path
            d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          />
        </svg>
        <span class="mt-2 block text-sm font-semibold text-gray-900">{{
          buttonLabel
        }}</span>
      </button>
    </div>
  </section>
</template>
