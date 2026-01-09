<script lang="ts" setup>
import type { Organization } from "better-auth/client";
import dayjs from "dayjs";
import { computed } from "vue";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";

const props = defineProps<{
  organizations: Organization[];
}>();

const rows = computed(() => {
  return props.organizations.map(i => ({
    id: i.id,
    name: i.name,
    createdAt:
      i.createdAt && dayjs(i.createdAt).isValid()
        ? dayjs(i.createdAt).format("DD.MM.YYYY")
        : "",
  }));
});
</script>

<template>
  <div>
    <ListHeader
      description="All organizations on this instance."
      title="Organizations"
    />
    <SimpleTable
      :headers="['ID', 'name', 'createdAt']"
      :row-actions="[]"
      :rows="rows"
    />
  </div>
</template>
