<script setup lang="ts">
import type { DerivedStatus } from "../../../../src/schema";
import { badgeClass } from "./shared";

defineProps<{ status: DerivedStatus; compact?: boolean }>();
</script>

<template>
  <span class="cm-badge" :class="[badgeClass(status), { compact }]">{{ status }}</span>
</template>
