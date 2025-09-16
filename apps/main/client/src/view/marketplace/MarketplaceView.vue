<template>
  <div class="">
    <div class="mt-8 flex flex-col gap-10">
      <div>
        <ModelTemplateList
          :is-marketplace-selected="isMarketplaceSelected"
          :selected="selectedTemplate ? [selectedTemplate] : []"
          :show-tabs="false"
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

<script lang="ts" setup>
import { ref } from "vue";
import ModelTemplateList from "../../components/models/ModelTemplateList.vue";
import { TemplateGetAllDto } from "@open-dpp/api-client";

const selectedTemplate = ref<TemplateGetAllDto | null>(null);
const isMarketplaceSelected = ref<boolean>(true);
</script>
