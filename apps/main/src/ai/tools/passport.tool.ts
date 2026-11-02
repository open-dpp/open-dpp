import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { Member } from "../../identity/organizations/domain/member";
import { User } from "../../identity/users/domain/user";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { PassportService } from "../../passports/application/services/passport.service";

/**
 * The roles a chat participant reads a passport with. A membership only counts
 * within the organization that owns the passport.
 */
export function chatSubject(
  user: User | null,
  member: Member | null,
  passportOrganizationId: string,
): SubjectAttributes {
  return SubjectAttributes.create({
    userRole: user?.role ?? UserRole.ANONYMOUS,
    memberRole: member?.organizationId === passportOrganizationId ? member.role : undefined,
  });
}

/**
 * Tool returning the passport the chat is about, filtered to what `subject` may read.
 * It is bound to that one passport so the model cannot be talked into fetching another.
 */
export function createPassportTool(
  passportService: PassportService,
  passportId: string,
  subject: SubjectAttributes,
) {
  return tool(
    async () => {
      const passport = await passportService.getExpandedProductPassport(passportId);
      return JSON.stringify(passport.toExportPlain(subject));
    },
    {
      name: "product-passport-tool",
      description: "Returns the product passport the user is asking about.",
      schema: z.object({}),
    },
  );
}
