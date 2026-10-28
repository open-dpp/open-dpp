<script lang="ts" setup>
import type { GuestAccessResponseDto } from "@open-dpp/dto";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { onMounted, useTemplateRef } from "vue";
import { useI18n } from "vue-i18n";
import { useGuestAccess } from "../../composables/guest-access.ts";
import { useGuestRoles } from "../../composables/guest-roles.ts";
import ChangeGuestRoleDialog from "./ChangeGuestRoleDialog.vue";
import InviteGuestDialog from "./InviteGuestDialog.vue";

const { t } = useI18n();
const { guestAccesses, fetchGuestAccesses, revokeGuestAccess, isEditable, statusLabel } =
  useGuestAccess();
const { getGuestRoleName } = useGuestRoles();

const inviteGuestDialog = useTemplateRef("inviteGuestDialog");
const changeGuestRoleDialog = useTemplateRef("changeGuestRoleDialog");

onMounted(fetchGuestAccesses);
</script>

<template>
  <InviteGuestDialog ref="inviteGuestDialog" @success="fetchGuestAccesses" />
  <ChangeGuestRoleDialog ref="changeGuestRoleDialog" @success="fetchGuestAccesses" />
  <DataTable :value="guestAccesses" data-key="id">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-xl font-bold">{{ t("guestAccess.title") }}</span>
          <p class="mt-1 text-sm font-normal text-gray-500">{{ t("guestAccess.description") }}</p>
        </div>
        <Button :label="t('guestAccess.invite')" @click="inviteGuestDialog?.open()" />
      </div>
    </template>
    <template #empty>{{ t("guestAccess.empty") }}</template>
    <Column field="email" :header="t('guestAccess.email')" />
    <Column field="guestRole" :header="t('guestAccess.role')">
      <template #body="{ data }: { data: GuestAccessResponseDto }">
        {{ getGuestRoleName(data.guestRole) }}
      </template>
    </Column>
    <Column field="status" :header="t('guestAccess.status.label')">
      <template #body="{ data }: { data: GuestAccessResponseDto }">
        {{ statusLabel(data) }}
      </template>
    </Column>
    <Column :header="t('common.actions')">
      <template #body="{ data }: { data: GuestAccessResponseDto }">
        <div v-if="isEditable(data)" class="flex gap-2">
          <Button severity="secondary" @click="changeGuestRoleDialog?.open(data)">
            {{ t("guestAccess.changeRole") }}
          </Button>
          <Button severity="danger" @click="revokeGuestAccess(data, fetchGuestAccesses)">
            {{ t("guestAccess.revoke") }}
          </Button>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
