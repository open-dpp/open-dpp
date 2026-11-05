import type { GuestAccessInvitationDto, UserDto } from "@open-dpp/dto";
import { GuestAccessStatusDto, GuestRoleDto } from "@open-dpp/dto";
import { AxiosError } from "axios";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useUserStore } from "../stores/user.ts";
import { GuestInvitationState, useGuestInvitation } from "./guest-invitation.ts";

const mocks = vi.hoisted(() => ({
  getInvitation: vi.fn(),
  accept: vi.fn(),
  getMe: vi.fn(),
  resendMyVerificationEmail: vi.fn(),
}));

vi.mock("../lib/api-client", () => ({
  default: {
    dpp: {
      guestAccess: {
        getInvitation: mocks.getInvitation,
        accept: mocks.accept,
      },
      users: {
        getMe: mocks.getMe,
        resendMyVerificationEmail: mocks.resendMyVerificationEmail,
      },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function invitation(overrides: Partial<GuestAccessInvitationDto> = {}): GuestAccessInvitationDto {
  return {
    id: "access-1",
    organizationName: "ACME GmbH",
    email: "repairer@example.com",
    guestRole: GuestRoleDto.REPAIRER,
    status: GuestAccessStatusDto.PENDING,
    ...overrides,
  };
}

function axiosError(status: number) {
  return new AxiosError("failed", undefined, undefined, undefined, {
    status,
    data: {},
  } as never);
}

function userDto(emailVerified: boolean): UserDto {
  return {
    id: "user-1",
    email: "repairer@example.com",
    firstName: "Rita",
    lastName: "Repair",
    name: "Rita Repair",
    image: null,
    emailVerified,
    preferredLanguage: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function signIn({ emailVerified }: { emailVerified: boolean }) {
  useUserStore().setMe(userDto(emailVerified));
}

describe("useGuestInvitation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    signIn({ emailVerified: true });
  });

  it("is loading until the invitation was requested", () => {
    const { state } = useGuestInvitation("access-1");

    expect(state.value).toEqual(GuestInvitationState.LOADING);
  });

  it("offers a pending invitation for acceptance", async () => {
    mocks.getInvitation.mockResolvedValue({ data: invitation() });
    const { state, invitation: loaded, fetchInvitation } = useGuestInvitation("access-1");

    await fetchInvitation();

    expect(mocks.getInvitation).toHaveBeenCalledWith("access-1");
    expect(state.value).toEqual(GuestInvitationState.PENDING);
    expect(loaded.value?.organizationName).toEqual("ACME GmbH");
  });

  it("shows accepted and revoked invitations as such", async () => {
    mocks.getInvitation.mockResolvedValueOnce({
      data: invitation({ status: GuestAccessStatusDto.ACCEPTED }),
    });
    const accepted = useGuestInvitation("access-1");
    await accepted.fetchInvitation();
    expect(accepted.state.value).toEqual(GuestInvitationState.ACCEPTED);

    mocks.getInvitation.mockResolvedValueOnce({
      data: invitation({ status: GuestAccessStatusDto.REVOKED }),
    });
    const revoked = useGuestInvitation("access-1");
    await revoked.fetchInvitation();
    expect(revoked.state.value).toEqual(GuestInvitationState.REVOKED);
  });

  it("is unavailable without a notification if the server answers 404", async () => {
    const logError = vi
      .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
      .mockImplementation(() => undefined);
    mocks.getInvitation.mockRejectedValue(axiosError(404));
    const { state, fetchInvitation } = useGuestInvitation("access-1");

    await fetchInvitation();

    expect(state.value).toEqual(GuestInvitationState.UNAVAILABLE);
    expect(logError).not.toHaveBeenCalled();
  });

  it("is unavailable and notifies on any other error", async () => {
    const logError = vi
      .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
      .mockImplementation(() => undefined);
    mocks.getInvitation.mockRejectedValue(axiosError(500));
    const { state, fetchInvitation } = useGuestInvitation("access-1");

    await fetchInvitation();

    expect(state.value).toEqual(GuestInvitationState.UNAVAILABLE);
    expect(logError).toHaveBeenCalledWith("guestAccess.accept.errorLoading", expect.any(Error));
  });

  describe("accept", () => {
    it("accepts and then shows the invitation as accepted", async () => {
      mocks.getInvitation.mockResolvedValue({ data: invitation() });
      mocks.accept.mockResolvedValue({ data: {} });
      const { state, fetchInvitation, accept } = useGuestInvitation("access-1");
      await fetchInvitation();

      const accepted = await accept();

      expect(accepted).toBe(true);
      expect(mocks.accept).toHaveBeenCalledWith("access-1");
      expect(state.value).toEqual(GuestInvitationState.ACCEPTED);
    });

    it("stays pending and notifies if accepting fails", async () => {
      const logError = vi
        .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
        .mockImplementation(() => undefined);
      mocks.getInvitation.mockResolvedValue({ data: invitation() });
      mocks.accept.mockRejectedValue(axiosError(400));
      const { state, accepting, fetchInvitation, accept } = useGuestInvitation("access-1");
      await fetchInvitation();

      const accepted = await accept();

      expect(accepted).toBe(false);
      expect(state.value).toEqual(GuestInvitationState.PENDING);
      expect(accepting.value).toBe(false);
      expect(logError).toHaveBeenCalledWith("guestAccess.accept.errorAccepting", expect.any(Error));
    });
  });

  describe("unverified email address", () => {
    it("asks for the verification first and does not load the invitation", async () => {
      signIn({ emailVerified: false });
      const { state, unverifiedEmail, fetchInvitation } = useGuestInvitation("access-1");

      await fetchInvitation();

      expect(state.value).toEqual(GuestInvitationState.UNVERIFIED);
      expect(unverifiedEmail.value).toEqual("repairer@example.com");
      expect(mocks.getInvitation).not.toHaveBeenCalled();
    });

    it("loads the invitation if the user is not known to the store", async () => {
      useUserStore().setMe(null);
      mocks.getInvitation.mockResolvedValue({ data: invitation() });
      const { state, fetchInvitation } = useGuestInvitation("access-1");

      await fetchInvitation();

      expect(state.value).toEqual(GuestInvitationState.PENDING);
    });

    it("reads the user from the server on recheck and continues once the address is verified", async () => {
      signIn({ emailVerified: false });
      const { state, fetchInvitation, recheck } = useGuestInvitation("access-1");
      await fetchInvitation();
      mocks.getMe.mockResolvedValue({ data: { user: userDto(true) } });
      mocks.getInvitation.mockResolvedValue({ data: invitation() });

      await recheck();

      expect(mocks.getMe).toHaveBeenCalledTimes(1);
      expect(useUserStore().me?.emailVerified).toBe(true);
      expect(state.value).toEqual(GuestInvitationState.PENDING);
    });

    it("stays unverified on recheck if the address is still not verified", async () => {
      signIn({ emailVerified: false });
      const { state, fetchInvitation, recheck } = useGuestInvitation("access-1");
      await fetchInvitation();
      mocks.getMe.mockResolvedValue({ data: { user: userDto(false) } });

      await recheck();

      expect(state.value).toEqual(GuestInvitationState.UNVERIFIED);
      expect(mocks.getInvitation).not.toHaveBeenCalled();
    });

    it("notifies and keeps the state if the user cannot be read on recheck", async () => {
      const logError = vi
        .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
        .mockImplementation(() => undefined);
      signIn({ emailVerified: false });
      const { state, fetchInvitation, recheck } = useGuestInvitation("access-1");
      await fetchInvitation();
      mocks.getMe.mockRejectedValue(new Error("boom"));

      await recheck();

      expect(state.value).toEqual(GuestInvitationState.UNVERIFIED);
      expect(logError).toHaveBeenCalledWith("guestAccess.accept.errorLoading", expect.any(Error));
    });

    it("sends the verification again and returns to this page", async () => {
      signIn({ emailVerified: false });
      mocks.resendMyVerificationEmail.mockResolvedValue({ data: {} });
      window.history.pushState({}, "", "/accept-guest-access/access-1?x=1");
      const { verificationResent, fetchInvitation, resendVerificationEmail } =
        useGuestInvitation("access-1");
      await fetchInvitation();

      await resendVerificationEmail();

      expect(mocks.resendMyVerificationEmail).toHaveBeenCalledWith({
        callbackPath: "/accept-guest-access/access-1?x=1",
      });
      expect(verificationResent.value).toBe(true);
    });

    it("notifies if the verification cannot be sent", async () => {
      const logError = vi
        .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
        .mockImplementation(() => undefined);
      signIn({ emailVerified: false });
      mocks.resendMyVerificationEmail.mockRejectedValue(new Error("boom"));
      const { verificationResent, resending, fetchInvitation, resendVerificationEmail } =
        useGuestInvitation("access-1");
      await fetchInvitation();

      await resendVerificationEmail();

      expect(verificationResent.value).toBe(false);
      expect(resending.value).toBe(false);
      expect(logError).toHaveBeenCalledWith("guestAccess.accept.errorResending", expect.any(Error));
    });

    it("sends nothing if there is no unverified address", async () => {
      const { resendVerificationEmail } = useGuestInvitation("access-1");

      await resendVerificationEmail();

      expect(mocks.resendMyVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
