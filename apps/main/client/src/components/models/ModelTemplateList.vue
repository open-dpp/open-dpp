<template>
  <div class="flex flex-col gap-4">
    <div>{{ t('draft.drafts') }}</div>
    <div v-if="showTabs">
      <Tabs
        :tabs="[t('models.myDrafts'), t('marketplace.marketplace')]"
        :value="selectedTabIndex"
        @change="
          (index) => {
            emits('update-is-marketplace-selected', index === 1);
          }
        "
      />
    </div>
    <div>
      <AdvancedListSelector
        :headers="[t('draft.form.name.label'), t('draft.version')]"
        :items="selectedTabIndex === 0 ? localTemplates : marketplaceTemplates"
        :pagination="{
          rowsPerPage: 5,
        }"
        :selected="selected"
        :selection="{
          multiple: false,
        }"
        :show-options="false"
        @update-selected-items="emits('update-selected-items', $event)"
      >
        <template #row="{ item }">
          <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
            {{ (item as TemplateGetAllDto).name }}
          </td>
          <td class="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
            {{ (item as TemplateGetAllDto).version }}
          </td>
        </template>
      </AdvancedListSelector>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import AdvancedListSelector from '../lists/AdvancedListSelector.vue';
import apiClient from '../../lib/api-client';
import { TemplateGetAllDto } from '@open-dpp/api-client';
import Tabs from '../lists/Tabs.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  selected: TemplateGetAllDto[];
  showTabs?: boolean;
  isMarketplaceSelected?: boolean;
}>();

const emits = defineEmits<{
  (e: 'update-selected-items', items: TemplateGetAllDto[]): void;
  (e: 'update-is-marketplace-selected', isSelected: boolean): void;
}>();

const localTemplates = ref<TemplateGetAllDto[]>([]);
const marketplaceTemplates = ref<TemplateGetAllDto[]>([]);
const selectedTabIndex = ref<number>(props.isMarketplaceSelected ? 1 : 0);

watch(
  () => props.isMarketplaceSelected,
  (value) => {
    selectedTabIndex.value = value ? 1 : 0;
  },
);

onMounted(async () => {
  const response = await apiClient.dpp.templates.getAll();
  localTemplates.value = response.data;
  const marketplaceResponse =
    await apiClient.marketplace.passportTemplates.getAll();
  marketplaceTemplates.value = marketplaceResponse.data;
});
</script>
