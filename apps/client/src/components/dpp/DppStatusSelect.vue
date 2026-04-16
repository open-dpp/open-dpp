<script setup lang="ts">
import { DppStatusDto, type DppStatusDtoType } from "@open-dpp/dto";

const model = defineModel<DppStatusDtoType>();

const options = Object.entries(DppStatusDto).map(([key, value]) => ({ key, value }));
</script>

<template>
  <Select
    v-model="model"
    :options="options"
    option-label="value"
    option-value="key"
    placeholder="Select a Status"
    class="w-40"
  />
</template>
