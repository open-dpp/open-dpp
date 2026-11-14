import type { GuestAccessInvitationDto } from "@open-dpp/dto";
import { GuestAccessStatusDto } from "@open-dpp/dto";
import { isAxiosError } from "axios";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import apiClient from "../lib/api-client.ts";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useUserStore } from "../stores/user.ts";
import { HTTPCode } from "../stores/http-codes.ts";

export const GuestInvitationState = {
  LOADING: "loading",
  UNVERIFIED: "unverified",
  UNAVAILABLE: "unavailable",
  PENDING: "pending",
  ACCEPTED: "accepted",
  REVOKED: "revoked",
} as const;

export type GuestInvitationStateType =
  (typeof GuestInvitationState)[keyof typeof GuestInvitationState];

export function useGuestInvitation(id: string) {
  const errorHandlingStore = useErrorHandlingStore();
  const userStore = useUserStore();
  const { t } = useI18n();

  const invitation = ref<GuestAccessInvitationDto | null>(null);
  const loading = ref(true);
  const accepting = ref(false);
  // Set while the signed in user has not verified their email address yet
  const unverifiedEmail = ref<string | null>(null);
  const resending = ref(false);
  const verificationResent = ref(false);

  // The server answers 404 for everybody who is not the invited person (another email, an email
  // which is not verified yet, an unknown invitation), so the page cannot say which one it is.
  async function fetchInvitation() {
    loading.value = true;
    try {
      // Without a verified address the server answers 404 for everybody, so ask for it first
      const me = userStore.me;
      unverifiedEmail.value = me && !me.emailVerified ? me.email : null;
      if (unverifiedEmail.value) {
        invitation.value = null;
        return;
      }
      const response = await apiClient.dpp.guestAccess.getInvitation(id);
      invitation.value = response.data;
    } catch (error) {
      invitation.value = null;
      if (!(isAxiosError(error) && error.response?.status === HTTPCode.NOT_FOUND)) {
        errorHandlingStore.logErrorWithNotification(t("guestAccess.accept.errorLoading"), error);
      }
    } finally {
      loading.value = false;
    }
  }

  // The person verified the address meanwhile, e.g. in another tab: read the user from the server
  async function recheck() {
    try {
      const response = await apiClient.dpp.users.getMe();
      userStore.setMe(response.data.user);
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("guestAccess.accept.errorLoading"), error);
      return;
    }
    await fetchInvitation();
  }

  // The link of the mail brings the person back to this page
  async function resendVerificationEmail() {
    if (!unverifiedEmail.value) {
      return;
    }
    resending.value = true;
    try {
      await apiClient.dpp.users.resendMyVerificationEmail({
        callbackPath: window.location.pathname + window.location.search,
      });
      verificationResent.value = true;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("guestAccess.accept.errorResending"), error);
    } finally {
      resending.value = false;
    }
  }

  async function accept(): Promise<boolean> {
    accepting.value = true;
    try {
      await apiClient.dpp.guestAccess.accept(id);
      if (invitation.value) {
        invitation.value = { ...invitation.value, status: GuestAccessStatusDto.ACCEPTED };
      }
      return true;
    } catch (error) {
      errorHandlingStore.logErrorWithNotification(t("guestAccess.accept.errorAccepting"), error);
      return false;
    } finally {
      accepting.value = false;
    }
  }

  const state = computed<GuestInvitationStateType>(() => {
    if (loading.value) return GuestInvitationState.LOADING;
    if (unverifiedEmail.value) return GuestInvitationState.UNVERIFIED;
    if (!invitation.value) return GuestInvitationState.UNAVAILABLE;
    if (invitation.value.status === GuestAccessStatusDto.ACCEPTED)
      return GuestInvitationState.ACCEPTED;
    if (invitation.value.status === GuestAccessStatusDto.REVOKED)
      return GuestInvitationState.REVOKED;
    return GuestInvitationState.PENDING;
  });

  return {
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
  };
}
