import { describe, expect, it, jest } from "@jest/globals";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { Member } from "../../identity/organizations/domain/member";
import { MemberRole } from "../../identity/organizations/domain/member-role.enum";
import { User } from "../../identity/users/domain/user";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { PassportService } from "../../passports/application/services/passport.service";
import { chatSubject, createPassportTool } from "./passport.tool";

describe("chatSubject", () => {
  const user = { role: UserRole.USER } as User;
  const member = { organizationId: "org-1", role: MemberRole.OWNER } as Member;

  it("is anonymous without a user", () => {
    expect(chatSubject(null, null, "org-1")).toEqual(
      SubjectAttributes.create({ userRole: UserRole.ANONYMOUS }),
    );
  });

  it("carries the member role within the passport's organization", () => {
    expect(chatSubject(user, member, "org-1")).toEqual(
      SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
    );
  });

  it("drops the member role of another organization", () => {
    expect(chatSubject(user, member, "org-2")).toEqual(
      SubjectAttributes.create({ userRole: UserRole.USER }),
    );
  });
});

describe("createPassportTool", () => {
  it("exports the bound passport for the bound subject, ignoring model input", async () => {
    const toExportPlain = jest.fn((_subject: SubjectAttributes) => ({ id: "passport-1" }));
    const getExpandedProductPassport = jest.fn(async (_passportId: string) => ({ toExportPlain }));
    const passportService = { getExpandedProductPassport } as unknown as PassportService;
    const subject = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    const passportTool = createPassportTool(passportService, "passport-1", subject);
    const result = await passportTool.invoke({ passportId: "passport-2" } as any);

    expect(getExpandedProductPassport).toHaveBeenCalledWith("passport-1");
    expect(toExportPlain).toHaveBeenCalledWith(subject);
    expect(JSON.parse(result as string)).toEqual({ id: "passport-1" });
  });
});
