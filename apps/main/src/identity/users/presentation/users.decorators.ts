import { Query } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { InvitationStatusDtoEnum } from "@open-dpp/dto";

export const InvitationStatusQueryParamSchema = InvitationStatusDtoEnum.optional().meta({
  description: "Filter invitations by status",
  example: "pending",
  param: { in: "query", name: "status" },
});

export const InvitationStatusQueryParam = () =>
  Query("status", new ZodValidationPipe(InvitationStatusQueryParamSchema));
