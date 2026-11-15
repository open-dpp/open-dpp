import { describe, expect, it, vi } from "vitest";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { PassportService } from "../../passports/application/services/passport.service";
import { createPassportTool } from "./passport.tool";

describe("createPassportTool", () => {
  it("exports the bound passport for the bound subject, ignoring model input", async () => {
    const toExportPlain = vi.fn((_subject: SubjectAttributes) => ({ id: "passport-1" }));
    const getExpandedProductPassport = vi.fn(async (_passportId: string) => ({ toExportPlain }));
    const passportService = { getExpandedProductPassport } as unknown as PassportService;
    const subject = SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });

    const passportTool = createPassportTool(passportService, "passport-1", subject);
    const result = await passportTool.invoke({ passportId: "passport-2" } as any);

    expect(getExpandedProductPassport).toHaveBeenCalledWith("passport-1");
    expect(toExportPlain).toHaveBeenCalledWith(subject);
    expect(JSON.parse(result as string)).toEqual({ id: "passport-1" });
  });
});
