import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { PassportService } from "../../passports/application/services/passport.service";

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
