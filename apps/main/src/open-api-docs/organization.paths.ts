import { InvitationResponseSchema, MemberRoleChangeDtoSchema } from "@open-dpp/dto";
import { HTTPCode } from "./http.codes";
import { ContentType } from "./content.types";
import { IdParamSchema } from "../aas/presentation/aas.decorators";

const tag = "organizations";

export const organizationsPaths = {
  "/organizations/invitations/{id}": {
    get: {
      tags: [tag],
      parameters: [IdParamSchema],
      summary: "Returns invitation with the specified id",
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: InvitationResponseSchema },
          },
        },
      },
    },
  },
  "/organizations/members/{id}/role": {
    patch: {
      tags: [tag],
      parameters: [IdParamSchema],
      summary: "Updates the role of a member",
      description: "Only the organization owner can update the role of a member.",
      requestBody: {
        content: {
          [ContentType.JSON]: {
            schema: MemberRoleChangeDtoSchema,
          },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          description: "Role updated successfully",
        },
      },
    },
  },
};
