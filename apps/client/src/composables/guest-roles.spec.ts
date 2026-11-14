import { GuestRoleDto } from "@open-dpp/dto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGuestRoles } from "./guest-roles.ts";

const i18n = vi.hoisted(() => ({ translations: {} as Record<string, string> }));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => i18n.translations[key] ?? key,
  }),
}));

describe("useGuestRoles", () => {
  beforeEach(() => {
    i18n.translations = {};
  });

  it("offers every guest role with its name", () => {
    const { guestRoleOptions } = useGuestRoles();

    expect(guestRoleOptions).toEqual(
      Object.values(GuestRoleDto).map((guestRole) => ({
        value: guestRole,
        label: `user.guestRoles.${guestRole}`,
      })),
    );
  });

  it("names a guest role", () => {
    const { getGuestRoleName } = useGuestRoles();

    expect(getGuestRoleName(GuestRoleDto.MARKET_SURVEILLANCE)).toEqual(
      "user.guestRoles.MarketSurveillance",
    );
  });

  it("describes a guest role only when it has a description", () => {
    i18n.translations = {
      "user.guestRoleDescriptions.Repairer": "Repairs products",
      "user.guestRoleDescriptions.Supplier": "",
    };
    const { getGuestRoleDescription } = useGuestRoles();

    expect(getGuestRoleDescription(GuestRoleDto.REPAIRER)).toEqual("Repairs products");
    expect(getGuestRoleDescription(GuestRoleDto.SUPPLIER)).toBeUndefined();
  });
});
