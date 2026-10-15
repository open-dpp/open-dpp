import { describe, expect, it } from "@jest/globals";
import {
  CreateGuestAccessDtoSchema,
  GuestAccessResponseDtoSchema,
  GuestRoleDtoEnum,
  UpdateGuestAccessRolesDtoSchema,
} from "./guest-access.dto";

describe("GuestRoleDtoEnum", () => {
  it("contains the five guest roles", () => {
    expect(GuestRoleDtoEnum.options).toEqual([
      "Repairer",
      "Recycler",
      "MarketSurveillance",
      "IndependentOperator",
      "Supplier",
    ]);
  });

  it("rejects member and user roles", () => {
    expect(() => GuestRoleDtoEnum.parse("member")).toThrow();
    expect(() => GuestRoleDtoEnum.parse("owner")).toThrow();
  });
});

describe("CreateGuestAccessDtoSchema", () => {
  const valid = { kind: "Direct", email: "repairer@example.com", guestRoles: ["Repairer"] };

  it("parses a direct guest access", () => {
    expect(CreateGuestAccessDtoSchema.parse(valid)).toEqual(valid);
  });

  it("rejects an invalid email", () => {
    expect(() => CreateGuestAccessDtoSchema.parse({ ...valid, email: "nope" })).toThrow();
  });

  it("rejects empty and duplicate roles", () => {
    expect(() => CreateGuestAccessDtoSchema.parse({ ...valid, guestRoles: [] })).toThrow();
    expect(() =>
      CreateGuestAccessDtoSchema.parse({ ...valid, guestRoles: ["Repairer", "Repairer"] }),
    ).toThrow();
  });

  it("rejects an unknown kind", () => {
    expect(() => CreateGuestAccessDtoSchema.parse({ ...valid, kind: "Organization" })).toThrow();
  });
});

describe("UpdateGuestAccessRolesDtoSchema", () => {
  it("requires at least one role", () => {
    expect(UpdateGuestAccessRolesDtoSchema.parse({ guestRoles: ["Supplier"] })).toEqual({
      guestRoles: ["Supplier"],
    });
    expect(() => UpdateGuestAccessRolesDtoSchema.parse({ guestRoles: [] })).toThrow();
  });
});

describe("GuestAccessResponseDtoSchema", () => {
  const pending = {
    id: "0a6e9a7e-2b0c-4a9b-9a53-8c2a3bd0a111",
    organizationId: "acme",
    kind: "Direct",
    email: "repairer@example.com",
    guestRoles: ["Repairer", "IndependentOperator"],
    grantedBy: "user-1",
    status: "Pending",
    createdAt: "2026-10-13T10:00:00.000Z",
  };

  it("parses a pending direct guest access without acceptance data", () => {
    const parsed = GuestAccessResponseDtoSchema.parse(pending);
    expect(parsed).toEqual(pending);
  });

  it("parses an accepted one including the accepting user id", () => {
    const accepted = {
      ...pending,
      status: "Accepted",
      acceptedAt: "2026-10-14T10:00:00.000Z",
      acceptedByUserId: "user-2",
    };
    const parsed = GuestAccessResponseDtoSchema.parse(accepted);
    expect(parsed).toEqual(accepted);
  });

  it("rejects an unknown status", () => {
    expect(() => GuestAccessResponseDtoSchema.parse({ ...pending, status: "Active" })).toThrow();
  });
});
