<script lang="ts" setup>
import type { UserWithRole } from "better-auth/plugins";
import type { MenuItem } from "primevue/menuitem";
import { Button, Column, DataTable, InputGroup, InputGroupAddon, InputText, Menu } from "primevue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  users: (UserWithRole & {
    firstName?: string;
    lastName?: string;
    name?: string;
  })[];
  currentUserRole: string;
}>();

const emits = defineEmits<{
  (e: "add"): void;
  (e: "inviteToOrg", email: string): void;
  (e: "changeRole", userId: string, email: string, role: string): void;
}>();

const { t } = useI18n();

const roleLabels: Record<string, string> = {
  admin: "organizations.admin.changeRoleDialog.roleAdmin",
  user: "organizations.admin.changeRoleDialog.roleUser",
};

function translateRole(role: string): string {
  const key = roleLabels[role];
  return key ? t(key) : role;
}

const rowMenuRef = ref();
const rowMenuItems = ref<MenuItem[]>([]);
const activeRowId = ref("");

const rows = computed(() => {
  return props.users.map(i => ({
    id: i.id,
    email: i.email,
    role: i.role ?? "user",
    name: i.name ?? (`${i.firstName ?? ""} ${i.lastName ?? ""}`.trim() || "N/A"),
    emailVerified: Boolean(i.emailVerified),
  }));
});

function copyId() {
  navigator.clipboard.writeText(activeRowId.value);
}

function toggleRowMenu(event: Event, row: (typeof rows.value)[number]) {
  activeRowId.value = row.id;
  const items: MenuItem[] = [
    {
      label: t("organizations.admin.inviteToOrganizationDialog.title"),
      icon: "pi pi-building",
      command: () => emits("inviteToOrg", row.email),
    },
  ];
  if (props.currentUserRole === "admin") {
    items.push({
      label: t("organizations.admin.changeRoleDialog.title"),
      icon: "pi pi-shield",
      command: () => emits("changeRole", row.id, row.email, row.role),
    });
  }
  rowMenuItems.value = items;
  rowMenuRef.value.toggle(event);
}
</script>

<template>
  <DataTable :value="rows" table-style="min-width: 50rem">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t('organizations.admin.users') }}</span>
        <Button :label="t('common.add')" @click="emits('add')" />
      </div>
    </template>
    <Column field="email" :header="t('user.email')">
      <template #body="{ data }">
        <div class="flex items-center gap-2">
          <span>{{ data.email }}</span>
          <i
            v-if="!data.emailVerified"
            v-tooltip.top="t('organizations.admin.emailNotVerified')"
            class="pi pi-exclamation-circle text-orange-500"
          />
        </div>
      </template>
    </Column>
    <Column field="role" :header="t('organizations.memberRole')">
      <template #body="{ data }">
        {{ translateRole(data.role) }}
      </template>
    </Column>
    <Column field="name" :header="t('common.name')" />
    <Column style="width: 3rem">
      <template #body="{ data }">
        <div class="flex w-full justify-end">
          <Button
            icon="pi pi-ellipsis-v"
            severity="secondary"
            text
            rounded
            size="small"
            :aria-label="t('common.actions')"
            @click="toggleRowMenu($event, data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <Menu
    id="overlay_row_menu"
    ref="rowMenuRef"
    :model="rowMenuItems"
    :popup="true"
    class="p-2"
  >
    <template #start>
      <div>
        <InputGroup>
          <InputGroupAddon>{{ t('common.id') }}</InputGroupAddon>
          <InputText readonly :value="activeRowId" />
          <InputGroupAddon>
            <Button icon="pi pi-copy" severity="secondary" @click="copyId" />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </template>
  </Menu>
</template>
