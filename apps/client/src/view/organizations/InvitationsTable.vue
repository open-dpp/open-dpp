<script setup lang="ts">
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import { useI18n } from "vue-i18n";
import { useInstanceSettings } from "../../composables/instance.settings.ts";
import { useInvitations } from "../../composables/invitation.ts";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import { onMounted } from "vue";
import { InvitationStatusDto } from "@open-dpp/dto";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrBefore);

const { t } = useI18n();
const { invitations, fetchInvitations } = useInvitations();

function isInvitationDisabled(expiresAt: string) {
  return dayjs(expiresAt).isSameOrBefore(dayjs());
}

async function fetchPendingInvitations() {
  await fetchInvitations({ status: InvitationStatusDto.PENDING });
}

onMounted(async () => {
  await fetchPendingInvitations();
});
</script>

<template>
  <DataTable :value="invitations" tableStyle="min-width: 50rem">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">{{ t("organizations.userInvitations.title") }}</span>
        <Button icon="pi pi-refresh" rounded raised @click="fetchPendingInvitations" />
      </div>
    </template>
    <Column field="id" header="Id"></Column>
    <Column
      field="organization.name"
      :header="t('organizations.invitation.invitedToOrganization')"
    />
    <Column field="inviter.name" :header="t('organizations.invitation.invitedBy')" />
    <Column :header="t('organizations.invitation.expiresAt')">
      <template #body="slotProps">
        <p>
          {{ dayjs(slotProps.data.expiresAt).format("LLL") }}
        </p>
      </template>
    </Column>
    <Column>
      <template #body="{ data }">
        <div class="flex w-full justify-end">
          <div class="flex items-center gap-2 rounded-md">
            <Button v-if="!isInvitationDisabled(data.expiresAt)" asChild v-slot="slotProps">
              <RouterLink :to="`/accept-invitation/${data.id}`" :class="slotProps.class">{{
                t("organizations.invitation.accept")
              }}</RouterLink>
            </Button>
            <p v-else class="text-red-400">
              {{ t("organizations.invitation.expired") }}
            </p>
          </div>
        </div>
      </template>
    </Column>
  </DataTable>
</template>
