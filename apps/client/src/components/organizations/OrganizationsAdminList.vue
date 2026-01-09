<script lang="ts" setup>
import type { Organization } from "better-auth/client";
import dayjs from "dayjs";
import { computed } from "vue";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";

const props = defineProps<{
  organizations: Organization[];
}>();

const emits = defineEmits<{
  (e: "add"): void;
}>();

const rows = computed(() => {
  return props.organizations.map(i => ({
    id: i.id,
    name: i.name,
    createdAt: dayjs(i.createdAt).format("DD.MM.YYYY"),
  }));
});
</script>

<template>
  <div>
    <ListHeader
      description="All organizations on this instance."
      title="Organizations"
      @add="emits('add')"
    />
    <SimpleTable
      :headers="['ID', 'name', 'createdAt']"
      :row-actions="[]"
      :rows="rows"
    />
  </div>
</template>
