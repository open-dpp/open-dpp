<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useUserStore } from "../../stores/user";

const { me } = storeToRefs(useUserStore());

const fullName = computed(() => {
  if (!me.value) return "AN";
  const name = [me.value.firstName, me.value.lastName].filter(Boolean).join(" ");
  return name || "AN";
});
</script>

<template>
  <span
    aria-hidden="true"
    class="ml-4 hidden text-sm leading-6 font-semibold text-gray-900 xl:inline-block"
    >{{ fullName }}</span
  >
</template>
