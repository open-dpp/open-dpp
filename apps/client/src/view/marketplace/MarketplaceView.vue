<script lang="ts" setup>
import type { TemplateGetAllDto } from "@open-dpp/api-client";
import { ref } from "vue";
import ModelTemplateList from "../../components/models/ModelTemplateList.vue";

const selectedTemplate = ref<TemplateGetAllDto | null>(null);
const isMarketplaceSelected = ref<boolean>(true);
</script>

<template>
  <div class="">
    <div class="mt-8 flex flex-col gap-10">
      <div>
        <ModelTemplateList
          :is-marketplace-selected="isMarketplaceSelected"
          :selected="selectedTemplate ? [selectedTemplate] : []"
          :show-tabs="true"
          @update-selected-items="
            (items) => (selectedTemplate = items[0] ? items[0] : null)
          "
          @update-is-marketplace-selected="
            (isSelected) => (isMarketplaceSelected = isSelected)
          "
        />
      </div>
    </div>
  </div>
</template>
