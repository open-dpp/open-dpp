import { expect } from "@jest/globals";
import { DataTypeDef, PermissionKind, Permissions } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { propertyInputPlainFactory } from "@open-dpp/testing";
import { MemberRole } from "../../../identity/organizations/domain/member-role.enum";
import { UserRole } from "../../../identity/users/domain/user-role.enum";
import { IdShortPath } from "../common/id-short-path";
import { Permission } from "../security/permission";
import { Security } from "../security/security";
import { SubjectAttributes } from "../security/subject-attributes";

import { Property } from "./property";

describe("property", () => {
  it.each([
    { value: "blub1", valueType: DataTypeDef.Double, errorMessage: "Invalid input: expected number, received NaN" },
    { value: "blub1", valueType: DataTypeDef.Float, errorMessage: "Invalid input: expected number, received NaN" },
  ])("should validate value attribute for $valueType", ({ value, valueType, errorMessage }) => {
    expect(() => Property.create({ idShort: "b1", value, valueType })).toThrow(
      new ValueError(`Invalid value for valueType ${valueType}: ${errorMessage}`),
    );
  });

  describe("dateTime value validation", () => {
    // DateTime must be an unambiguous point in time: ISO-8601 with an
    // explicit timezone offset. Otherwise the same string renders differently
    // in different viewer timezones (the reviewer's concern in PR #490).
    it.each([
      "2026-04-10T14:00:00Z",
      "2026-04-10T14:00:00.123Z",
      "2026-04-10T14:00:00+02:00",
      "2026-04-10T14:00:00-05:00",
      "2026-04-10T14:00:00.500+02:00",
    ])("accepts ISO-8601 DateTime with an explicit offset: %s", (value) => {
      expect(() =>
        Property.create({ idShort: "b1", value, valueType: DataTypeDef.DateTime }),
      ).not.toThrow();
    });

    it.each([
      // No timezone offset — ambiguous floating time.
      "2026-04-10T14:00:00",
      // Date-only — not a DateTime.
      "2026-04-10",
      // Free-form string.
      "not-a-date",
      "",
    ])("rejects DateTime without an explicit offset: %s", (value) => {
      expect(() =>
        Property.create({ idShort: "b1", value, valueType: DataTypeDef.DateTime }),
      ).toThrow(ValueError);
    });

    it("accepts null DateTime values", () => {
      expect(() =>
        Property.create({ idShort: "b1", value: null, valueType: DataTypeDef.DateTime }),
      ).not.toThrow();
    });
  });

  it("should add submodel element", () => {
    const property = Property.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect(() => property.addSubmodelElement(Property.fromPlain(propertyInputPlainFactory.build()))).toThrow(
      new ValueError("Property cannot contain submodel elements"),
    );
  });

  it("should get submodel elements", () => {
    const property = Property.create({ idShort: "b1", valueType: DataTypeDef.String });
    expect(property.getSubmodelElements()).toEqual([]);
  });

  it("should return plain value", () => {
    const security = Security.create({});
    const member = SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER });
    const anonymous = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    const property = Property.create({
      idShort: "prop1",
      valueType: DataTypeDef.String,
    });
    security.addPolicy(member, IdShortPath.create({ path: "prop1" }), [Permission.create({ permission: Permissions.Read, kindOfPermission: PermissionKind.Allow })]);
    let ability = security.defineAbilityForSubject(member);
    expect(property.toPlain({ ability })).toMatchObject({
      idShort: "prop1",
      valueType: DataTypeDef.String,
    });
    ability = security.defineAbilityForSubject(anonymous);
    expect(property.toPlain({ ability })).toEqual({});
  });
});
