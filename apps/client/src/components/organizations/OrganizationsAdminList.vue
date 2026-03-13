<script lang="ts" setup>
import type { Organization } from "better-auth/client";
import type { MenuItem } from "primevue/menuitem";
import dayjs from "dayjs";
import { Button, Column, DataTable, InputGroup, InputGroupAddon, InputText, Menu } from "primevue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  organizations: Organization[];
}>();

const { t } = useI18n();

const rowMenuRef = ref();
const rowMenuItems = ref<MenuItem[]>([]);
const activeRowId = ref("");

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

function copyId() {
  navigator.clipboard.writeText(activeRowId.value);
}

function toggleRowMenu(event: Event, row: (typeof rows.value)[number]) {
  activeRowId.value = row.id;
  rowMenuItems.value = [];
  rowMenuRef.value.toggle(event);
}
</script>

<template>
  <DataTable :value="rows" table-style="min-width: 50rem">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t('admin.organizations.title', 'Organizations') }}</span>
      </div>
    </template>
    <Column field="name" header="Name" />
    <Column field="createdAt" header="Created At" />
    <Column style="width: 3rem">
      <template #body="{ data }">
        <div class="flex w-full justify-end">
          <Button
            icon="pi pi-ellipsis-v"
            severity="secondary"
            text
            rounded
            size="small"
            :aria-label="t('common.actions', 'Actions')"
            @click="toggleRowMenu($event, data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <Menu
    id="overlay_org_menu"
    ref="rowMenuRef"
    :model="rowMenuItems"
    :popup="true"
    class="p-2"
  >
    <template #start>
      <div>
        <InputGroup>
          <InputGroupAddon>ID</InputGroupAddon>
          <InputText readonly :value="activeRowId" />
          <InputGroupAddon>
            <Button icon="pi pi-copy" severity="secondary" @click="copyId" />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </template>
  </Menu>
</template>
