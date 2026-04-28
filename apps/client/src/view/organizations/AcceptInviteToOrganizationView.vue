<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { authClient } from "../../auth-client.ts";
import { useNotificationStore } from "../../stores/notification.ts";
import { onMounted, ref } from "vue";
import type { InvitationResponseDto } from "@open-dpp/dto";
import apiClient from "../../lib/api-client.ts";

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const notificationStore = useNotificationStore();
const { t } = useI18n();
const invitation = ref<InvitationResponseDto>();

onMounted(async () => {
  const response = await apiClient.dpp.organizations.getInvitation(props.id);
  invitation.value = response.data;
});

async function acceptInvite() {
  try {
    await authClient.organization.acceptInvitation({
      invitationId: props.id,
    });
    notificationStore.addSuccessNotification(t("organizations.invitation.acceptSuccess"));
    await router.push("/organizations");
  } catch {
    notificationStore.addErrorNotification(t("organizations.invitation.acceptError"));
  }
}
</script>

<template>
  <div
    v-if="invitation"
    class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8"
  >
    <Card>
      <template #title>
        {{ t("organizations.invitation.acceptTitle") }}
      </template>
      <template #content>
        <div>
          <div class="grid sm:grid-cols-2">
            <dt class="text-sm font-medium text-gray-900">
              {{ t("organizations.invitation.invitedToOrganization") }}
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ invitation.organization?.name }}
            </dd>
          </div>
          <div class="grid grid-cols-2">
            <dt class="text-sm font-medium text-gray-900">
              {{ t("organizations.invitation.invitedBy") }}
            </dt>
            <dd class="mt-1 text-sm/6 text-gray-700 sm:col-span-2 sm:mt-0">
              {{ invitation.inviter?.name }}
            </dd>
          </div>
        </div>
      </template>
      <template #footer>
        <div>
          <Button @click="acceptInvite">
            {{ t("organizations.invitation.accept") }}
          </Button>
        </div>
      </template>
    </Card>
  </div>
</template>
