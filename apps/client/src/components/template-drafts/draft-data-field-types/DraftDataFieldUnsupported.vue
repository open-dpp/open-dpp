<script lang="ts" setup>
import type { DataFieldDto } from "@open-dpp/api-client";

defineProps<{ dataField: DataFieldDto }>();
</script>

<template>
  <div
    class="p-2 text-red-500 block w-full shadow-xs ring-1 ring-inset ring-gray-300 select-none rounded-md border-0"
  >
    Datenfeldtyp <span class="font-bold">{{ dataField.type }}</span> wird nicht
    unterstützt.
  </div>
</template>
