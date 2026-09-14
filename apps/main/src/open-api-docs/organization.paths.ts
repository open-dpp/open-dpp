import {
  InvitationResponseSchema,
  MemberRoleChangeDtoSchema,
  OrganizationCreateDtoSchema,
  OrganizationDtoSchema,
} from "@open-dpp/dto";
import { HTTPCode } from "./http.codes";
import { ContentType } from "./content.types";
import { IdParamSchema } from "../aas/presentation/aas.decorators";

const tag = "organizations";

export const organizationsPaths = {
  "/organizations": {
    post: {
      tags: [tag],
      summary: "Creates an organization",
      description:
        "The caller becomes the organization's owner. Names need not be unique; the " +
        "organization's slug is an internal detail equal to its id and cannot be chosen. " +
        "Requires organization creation to be enabled for the instance, unless the caller is an admin.",
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: OrganizationCreateDtoSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: OrganizationDtoSchema },
          },
        },
        [HTTPCode.BAD_REQUEST]: {
          description: "The body is invalid (e.g. an empty name)",
        },
        [HTTPCode.FORBIDDEN]: {
          description: "Organization creation is disabled for this instance",
        },
      },
    },
  },
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
