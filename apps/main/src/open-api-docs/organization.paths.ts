import {
  InvitationResponseSchema,
  MemberRoleChangeDtoSchema,
  OrganizationCreateDtoSchema,
  OrganizationCreateResponseDtoSchema,
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
        "Without `owner`, the caller becomes the organization's owner. With `owner` (instance " +
        "admins only) the organization is provisioned for that user: the user is looked up by " +
        "email or created with a random password, becomes the organization's only owner and is " +
        "notified by mail; the calling admin is not added as a member and the response carries " +
        "`provisioning`. Names need not be unique; the organization's slug is an internal detail " +
        "equal to its id and cannot be chosen. Requires organization creation to be enabled for " +
        "the instance, unless the caller is an admin.",
      requestBody: {
        required: true,
        content: {
          [ContentType.JSON]: { schema: OrganizationCreateDtoSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: OrganizationCreateResponseDtoSchema },
          },
        },
        [HTTPCode.BAD_REQUEST]: {
          description: "The body is invalid (e.g. an empty name or an unsupported owner locale)",
        },
        [HTTPCode.FORBIDDEN]: {
          description:
            "Organization creation is disabled for this instance, or `owner` was sent by a caller " +
            "who is not an instance admin",
        },
        [HTTPCode.INTERNAL_SERVER_ERROR]: {
          description:
            "The organization could not be created; a user created by this call was removed again",
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
