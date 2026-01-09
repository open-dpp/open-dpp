<script lang="ts" setup>
import type { UserWithRole } from "better-auth/plugins";
import { computed } from "vue";
import ListHeader from "../lists/ListHeader.vue";
import SimpleTable from "../lists/SimpleTable.vue";

const props = defineProps<{
  users: (UserWithRole & {
    firstName?: string;
    lastName?: string;
    name?: string;
  })[];
}>();

const emits = defineEmits<{
  (e: "add"): void;
}>();

const rows = computed(() => {
  return props.users.map(i => ({
    id: i.id,
    email: i.email,
    role: i.role ?? "user",
    name: i.name ?? (`${i.firstName ?? ""} ${i.lastName ?? ""}`.trim() || "N/A"),
    emailVerified: i.emailVerified ? "Verified" : "Not verified",
  }));
});
</script>

<template>
  <div>
    <ListHeader
      creation-label="Add user"
      description="All users on this instance."
      title="Users"
      @add="emits('add')"
    />
    <SimpleTable
      :headers="['ID', 'email', 'role', 'name', 'emailVerified']"
      :row-actions="[]"
      :rows="rows"
    />
  </div>
</template>
