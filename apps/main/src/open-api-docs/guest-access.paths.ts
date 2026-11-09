import {
  CreateGuestAccessDtoSchema,
  GuestAccessInvitationDtoSchema,
  GuestAccessResponseDtoSchema,
  UpdateGuestAccessRoleDtoSchema,
} from "@open-dpp/dto";
import { z } from "zod";
import { IdParamSchema } from "../aas/presentation/aas.decorators";
import { ContentType } from "./content.types";
import { HTTPCode } from "./http.codes";

const tag = "guest-accesses";

const organizationIdHeader = { $ref: "#/components/parameters/OrganizationIdHeader" };
const security: Record<string, string[]>[] = [{ sessionAuth: [] }, { apiKeyAuth: [] }];

const guestAccessBody = {
  content: {
    [ContentType.JSON]: { schema: GuestAccessResponseDtoSchema },
  },
};

const conflictResponse = {
  description:
    "The guest access was changed by someone else after it was read, for example revoked. " +
    "Reload it and try again.",
};

const ownerErrorResponses = {
  [HTTPCode.FORBIDDEN]: { description: "The caller is not an owner of the organization." },
  [HTTPCode.NOT_FOUND]: { description: "The guest access does not exist." },
};

export const guestAccessPaths = {
  "/guest-accesses": {
    post: {
      tags: [tag],
      summary: "Invites an external person as guest",
      description:
        "Owner only. A guest is not a member: they can only read the fields which the access " +
        "rules of the template allow for their guest role, and only in the presentation view " +
        "of a passport. The invitation is sent by email and must be accepted by the invited " +
        "person.",
      parameters: [organizationIdHeader],
      requestBody: {
        required: true,
        content: {
          [ContentType.JSON]: { schema: CreateGuestAccessDtoSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: guestAccessBody,
        [HTTPCode.BAD_REQUEST]: { description: "The body is invalid." },
        [HTTPCode.FORBIDDEN]: { description: "The caller is not an owner of the organization." },
      },
      security,
    },
    get: {
      tags: [tag],
      summary: "Returns the guest accesses of the organization",
      description: "Owner only. Revoked accesses are included.",
      parameters: [organizationIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: z.array(GuestAccessResponseDtoSchema) },
          },
        },
        [HTTPCode.FORBIDDEN]: { description: "The caller is not an owner of the organization." },
      },
      security,
    },
  },
  "/guest-accesses/{id}/role": {
    patch: {
      tags: [tag],
      summary: "Changes the guest role of a guest access",
      description:
        "Owner only. Also possible while the invitation is pending. The guest is notified by " +
        "email.",
      parameters: [organizationIdHeader, IdParamSchema],
      requestBody: {
        required: true,
        content: {
          [ContentType.JSON]: { schema: UpdateGuestAccessRoleDtoSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: guestAccessBody,
        ...ownerErrorResponses,
        [HTTPCode.BAD_REQUEST]: { description: "The body is invalid or the access is revoked." },
        [HTTPCode.CONFLICT]: conflictResponse,
      },
      security: security,
    },
  },
  "/guest-accesses/{id}/revoke": {
    post: {
      tags: [tag],
      summary: "Revokes a guest access",
      description:
        "Owner only. The guest loses the access with the next request and is notified by email.",
      parameters: [organizationIdHeader, IdParamSchema],
      responses: {
        [HTTPCode.OK]: guestAccessBody,
        ...ownerErrorResponses,
        [HTTPCode.CONFLICT]: conflictResponse,
      },
      security,
    },
  },
  "/guest-accesses/{id}/invitation": {
    get: {
      tags: [tag],
      summary: "Returns the invitation shown to the invited person before accepting",
      description:
        "Only the account with the invited verified email address may read it. Requires no " +
        "organization header.",
      parameters: [IdParamSchema],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: GuestAccessInvitationDtoSchema },
          },
        },
        [HTTPCode.FORBIDDEN]: {
          description: "The account is not the invited one or its email is not verified.",
        },
        [HTTPCode.NOT_FOUND]: { description: "The invitation does not exist." },
      },
      security,
    },
  },
  "/guest-accesses/{id}/accept": {
    post: {
      tags: [tag],
      summary: "Accepts an invitation as the invited person",
      description:
        "Only the account with the invited verified email address may accept. Requires no " +
        "organization header.",
      parameters: [IdParamSchema],
      responses: {
        [HTTPCode.OK]: guestAccessBody,
        [HTTPCode.BAD_REQUEST]: { description: "The invitation is revoked or already accepted." },
        [HTTPCode.FORBIDDEN]: {
          description: "The account is not the invited one or its email is not verified.",
        },
        [HTTPCode.NOT_FOUND]: { description: "The invitation does not exist." },
        [HTTPCode.CONFLICT]: conflictResponse,
      },
      security,
    },
  },
};
