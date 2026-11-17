<script lang="ts" setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import BrandingLogo from "../../components/media/BrandingLogo.vue";
import RingLoader from "../../components/navigation/RingLoader.vue";
import { GuestInvitationState, useGuestInvitation } from "../../composables/guest-invitation.ts";
import { useGuestRoles } from "../../composables/guest-roles.ts";

const props = defineProps<{
  id: string;
}>();

const { t } = useI18n();
const {
  invitation,
  state,
  accepting,
  unverifiedEmail,
  resending,
  verificationResent,
  fetchInvitation,
  recheck,
  resendVerificationEmail,
  accept,
} = useGuestInvitation(props.id);
const { getGuestRoleName, getGuestRoleDescription } = useGuestRoles();

onMounted(fetchInvitation);
</script>

<template>
  <div class="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
    <Card class="p-3 sm:mx-auto sm:w-full sm:max-w-md">
      <template #header>
        <BrandingLogo />
      </template>
      <template #title>
        <p class="py-2 text-center">{{ t("guestAccess.accept.title") }}</p>
      </template>
      <template #content>
        <div data-testid="guest-invitation" :data-state="state">
          <RingLoader v-if="state === GuestInvitationState.LOADING" class="mx-auto w-fit" />
          <div v-else-if="state === GuestInvitationState.UNVERIFIED" class="flex flex-col gap-4">
            <Message severity="info" :closable="false" data-cy="verify-email">
              {{ t("guestAccess.accept.verifyEmail", { email: unverifiedEmail }) }}
            </Message>
            <Message v-if="verificationResent" severity="success" :closable="false">
              {{ t("guestAccess.accept.resent") }}
            </Message>
            <Button :label="t('guestAccess.accept.checkAgain')" class="w-full" @click="recheck" />
            <Button
              :label="t('guestAccess.accept.resend')"
              :loading="resending"
              severity="secondary"
              class="w-full"
              @click="resendVerificationEmail"
            />
          </div>
          <Message
            v-else-if="state === GuestInvitationState.UNAVAILABLE"
            severity="warn"
            :closable="false"
          >
            {{ t("guestAccess.accept.unavailable") }}
          </Message>
          <Message
            v-else-if="state === GuestInvitationState.REVOKED"
            severity="warn"
            :closable="false"
          >
            {{ t("guestAccess.accept.revoked") }}
          </Message>
          <Message
            v-else-if="state === GuestInvitationState.ACCEPTED"
            severity="success"
            :closable="false"
          >
            {{ t("guestAccess.accept.accepted") }}
          </Message>
          <div v-else-if="invitation" class="flex flex-col gap-4">
            <dl class="flex flex-col gap-3">
              <div>
                <dt class="text-sm font-medium text-gray-900">
                  {{ t("guestAccess.accept.organization") }}
                </dt>
                <dd class="mt-1 text-sm/6 text-gray-700">{{ invitation.organizationName }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-900">{{ t("guestAccess.role") }}</dt>
                <dd class="mt-1 text-sm/6 text-gray-700">
                  {{ getGuestRoleName(invitation.guestRole) }}
                </dd>
                <dd
                  v-if="getGuestRoleDescription(invitation.guestRole)"
                  class="mt-1 text-sm text-gray-600"
                  data-cy="guest-role-description"
                >
                  {{ getGuestRoleDescription(invitation.guestRole) }}
                </dd>
              </div>
            </dl>
            <p class="text-sm text-gray-600">{{ t("guestAccess.accept.readOnly") }}</p>
            <Button
              :label="t('guestAccess.accept.accept')"
              data-testid="guest-accept-btn"
              :loading="accepting"
              class="w-full"
              @click="accept"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
