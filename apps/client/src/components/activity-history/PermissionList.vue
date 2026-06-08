<script setup lang="ts">
import { usePermissions } from "../../composables/permissions.ts";
import type { PermissionDto } from "@open-dpp/dto";
import { computed } from "vue";
const props = defineProps<{ permissions: PermissionDto[] }>();
const { translatePermission } = usePermissions();

const list = computed(() =>
  props.permissions.map((permission) => translatePermission(permission.permission)).join(", "),
);
</script>

<template>
  <span>
    {{ list }}
  </span>
</template>

<style scoped></style>
