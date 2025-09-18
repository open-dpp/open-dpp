<template>
  <div class="w-full my-10">
    <div class="flex flex-row gap-10">
      <div
        v-if="productPassport && productPassport.dataSections.length > 1"
        class="bg-white shadow-sm px-6 py-4 min-w-48 hidden md:flex"
      >
        <Sidebar data-cy="sidebar" />
      </div>
      <div
        data-cy="content"
        v-if="productPassport"
        class="flex flex-col gap-5 w-full"
      >
        <ProductPassportHeader />
        <ProductPassportBody />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Sidebar from "./Sidebar.vue";
import ProductPassportHeader from "./ProductPassportHeader.vue";
import ProductPassportBody from "./ProductPassportBody.vue";
import { useProductPassportStore } from "../../stores/product-passport";
import { computed } from "vue";

const productPassportStore = useProductPassportStore();

const productPassport = computed(() => productPassportStore.productPassport);
</script>
