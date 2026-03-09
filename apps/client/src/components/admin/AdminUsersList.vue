<script lang="ts" setup>
import type { UserWithRole } from "better-auth/plugins";
import { BuildingOfficeIcon } from "@heroicons/vue/24/outline";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ListHeader from "../lists/ListHeader.vue";

const props = defineProps<{
  users: (UserWithRole & {
    firstName?: string;
    lastName?: string;
    name?: string;
  })[];
}>();

const emits = defineEmits<{
  (e: "add"): void;
  (e: "inviteToOrg", email: string): void;
}>();

const { t } = useI18n();

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
    <table class="min-w-full table-fixed divide-y divide-gray-300">
      <thead>
        <tr>
          <th class="min-w-[12rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900" scope="col">
            ID
          </th>
          <th class="min-w-[12rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900" scope="col">
            email
          </th>
          <th class="min-w-[6rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900" scope="col">
            role
          </th>
          <th class="min-w-[8rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900" scope="col">
            name
          </th>
          <th class="min-w-[8rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900" scope="col">
            emailVerified
          </th>
          <th class="py-3.5 pr-3 text-right text-sm font-semibold text-gray-900" scope="col" />
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
          <td class="whitespace-nowrap py-4 text-sm text-gray-500">
            {{ row.id }}
          </td>
          <td class="whitespace-nowrap py-4 text-sm text-gray-500">
            {{ row.email }}
          </td>
          <td class="whitespace-nowrap py-4 text-sm text-gray-500">
            {{ row.role }}
          </td>
          <td class="whitespace-nowrap py-4 text-sm text-gray-500">
            {{ row.name }}
          </td>
          <td class="whitespace-nowrap py-4 text-sm text-gray-500">
            {{ row.emailVerified }}
          </td>
          <td class="whitespace-nowrap py-4 pr-4 text-right text-sm font-medium">
            <button
              class="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
              :title="t('organizations.admin.inviteToOrganizationDialog.title')"
              @click="emits('inviteToOrg', row.email)"
            >
              <BuildingOfficeIcon class="size-4" />
              {{ t('organizations.admin.inviteToOrganizationDialog.invite') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
