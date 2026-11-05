import type { GuestAccessResponseDto } from "@open-dpp/dto";
import type { ConfirmationOptions } from "primevue/confirmationoptions";
import { GuestAccessKindDto, GuestAccessStatusDto, GuestRoleDto } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useErrorHandlingStore } from "../stores/error.handling.ts";
import { useGuestAccess } from "./guest-access.ts";

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  invite: vi.fn(),
  changeRole: vi.fn(),
  revoke: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("../lib/api-client", () => ({
  default: {
    dpp: {
      guestAccess: {
        getAll: mocks.getAll,
        invite: mocks.invite,
        changeRole: mocks.changeRole,
        revoke: mocks.revoke,
      },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({
    require: mocks.confirm,
  }),
}));

function guestAccess(overrides: Partial<GuestAccessResponseDto> = {}): GuestAccessResponseDto {
  return {
    kind: GuestAccessKindDto.DIRECT,
    id: "access-1",
    organizationId: "org-1",
    email: "repairer@example.com",
    guestRole: GuestRoleDto.REPAIRER,
    grantedBy: "owner-1",
    status: GuestAccessStatusDto.PENDING,
    createdAt: "2026-10-27T10:00:00.000Z",
    ...overrides,
  };
}

describe("useGuestAccess", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      setup() {
        return { api: useGuestAccess() };
      },
      template: "<div />",
    });
    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return wrapper.vm.api as ReturnType<typeof useGuestAccess>;
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount());
  });

  describe("fetchGuestAccesses", () => {
    it("loads the guest accesses", async () => {
      mocks.getAll.mockResolvedValue({ data: [guestAccess()] });
      const api = mountHarness();

      await api.fetchGuestAccesses();

      expect(api.guestAccesses.value).toEqual([guestAccess()]);
    });

    it("empties the list and notifies on an error", async () => {
      const logError = vi
        .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
        .mockImplementation(() => undefined);
      mocks.getAll.mockResolvedValueOnce({ data: [guestAccess()] });
      const api = mountHarness();
      await api.fetchGuestAccesses();
      mocks.getAll.mockRejectedValueOnce(new Error("boom"));

      await api.fetchGuestAccesses();

      expect(api.guestAccesses.value).toEqual([]);
      expect(logError).toHaveBeenCalledWith("guestAccess.errorLoading", expect.any(Error));
    });
  });

  describe("inviteGuest", () => {
    it("invites by trimmed email and role", async () => {
      mocks.invite.mockResolvedValue({ data: guestAccess() });
      const api = mountHarness();

      const invited = await api.inviteGuest(" repairer@example.com ", GuestRoleDto.REPAIRER);

      expect(invited).toBe(true);
      expect(mocks.invite).toHaveBeenCalledWith({
        kind: "Direct",
        email: "repairer@example.com",
        guestRole: GuestRoleDto.REPAIRER,
      });
    });

    it("reports a failed invitation without saying why", async () => {
      const logError = vi
        .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
        .mockImplementation(() => undefined);
      mocks.invite.mockRejectedValue(new Error("exists"));
      const api = mountHarness();

      const invited = await api.inviteGuest("repairer@example.com", GuestRoleDto.REPAIRER);

      expect(invited).toBe(false);
      expect(logError).toHaveBeenCalledWith("guestAccess.inviteError", expect.any(Error));
    });
  });

  describe("changeGuestRole", () => {
    it("changes the role", async () => {
      mocks.changeRole.mockResolvedValue({ data: guestAccess() });
      const api = mountHarness();

      const changed = await api.changeGuestRole("access-1", GuestRoleDto.SUPPLIER);

      expect(changed).toBe(true);
      expect(mocks.changeRole).toHaveBeenCalledWith("access-1", {
        guestRole: GuestRoleDto.SUPPLIER,
      });
    });

    it("reports a failed change", async () => {
      const logError = vi
        .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
        .mockImplementation(() => undefined);
      mocks.changeRole.mockRejectedValue(new Error("revoked"));
      const api = mountHarness();

      expect(await api.changeGuestRole("access-1", GuestRoleDto.SUPPLIER)).toBe(false);
      expect(logError).toHaveBeenCalledWith("guestAccess.changeRoleError", expect.any(Error));
    });
  });

  describe("revokeGuestAccess", () => {
    function requestedConfirmation() {
      return mocks.confirm.mock.calls[0][0] as ConfirmationOptions;
    }

    it("asks for confirmation first and revokes nothing before", async () => {
      const api = mountHarness();

      api.revokeGuestAccess(guestAccess(), vi.fn());

      expect(mocks.confirm).toHaveBeenCalledTimes(1);
      expect(requestedConfirmation().message).toContain("repairer@example.com");
      expect(mocks.revoke).not.toHaveBeenCalled();
    });

    it("revokes after the confirmation and refreshes", async () => {
      mocks.revoke.mockResolvedValue({ data: guestAccess() });
      const onRevoked = vi.fn();
      const api = mountHarness();
      api.revokeGuestAccess(guestAccess(), onRevoked);

      await requestedConfirmation().accept?.();

      expect(mocks.revoke).toHaveBeenCalledWith("access-1");
      expect(onRevoked).toHaveBeenCalledTimes(1);
    });

    it("notifies and does not refresh if revoking fails", async () => {
      const logError = vi
        .spyOn(useErrorHandlingStore(), "logErrorWithNotification")
        .mockImplementation(() => undefined);
      mocks.revoke.mockRejectedValue(new Error("boom"));
      const onRevoked = vi.fn();
      const api = mountHarness();
      api.revokeGuestAccess(guestAccess(), onRevoked);

      await requestedConfirmation().accept?.();

      expect(logError).toHaveBeenCalledWith("guestAccess.revokeError", expect.any(Error));
      expect(onRevoked).not.toHaveBeenCalled();
    });
  });

  describe("row helpers", () => {
    it("allows changes only until an access is revoked", () => {
      const api = mountHarness();

      expect(api.isEditable(guestAccess())).toBe(true);
      expect(api.isEditable(guestAccess({ status: GuestAccessStatusDto.ACCEPTED }))).toBe(true);
      expect(api.isEditable(guestAccess({ status: GuestAccessStatusDto.REVOKED }))).toBe(false);
    });

    it("labels the status", () => {
      const api = mountHarness();

      expect(api.statusLabel(guestAccess({ status: GuestAccessStatusDto.ACCEPTED }))).toEqual(
        "guestAccess.status.Accepted",
      );
    });
  });
});
