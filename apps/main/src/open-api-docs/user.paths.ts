import {
  CreateUserDtoSchema,
  InvitationResponseSchema,
  MeDtoSchema,
  RequestEmailChangeDtoSchema,
  SetUserRoleDtoSchema,
  UpdateProfileDtoSchema,
  UserDtoSchema,
} from "@open-dpp/dto";
import { z } from "zod";
import { IdParamSchema } from "../aas/presentation/aas.decorators";
import { InvitationStatusQueryParamSchema } from "../identity/users/presentation/users.decorators";
import { HTTPCode } from "./http.codes";
import { ContentType } from "./content.types";

const tag = "users";

// Revoke shapes mirror revoke-email-change.controller.ts; they were never
// promoted to @open-dpp/dto, so they live inline like the query-param schemas.
const RevokeEmailChangeBodySchema = z.object({ token: z.string() });
const RevokeResultSchema = z.object({ status: z.enum(["ok", "invalid", "error"]) });
const RevokeInfoSchema = z.object({ valid: z.boolean(), newEmail: z.string().optional() });
const RevokeTokenQueryParamSchema = z.string().meta({
  description: "Signed revoke token from the email link",
  param: { in: "query", name: "token" },
});

export const userPaths = {
  "/users": {
    post: {
      tags: [tag],
      summary: "Creates a new user",
      description: "Admin only.",
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: CreateUserDtoSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: UserDtoSchema },
          },
        },
      },
    },
  },
  "/users/me": {
    get: {
      tags: [tag],
      summary: "Returns the current user with any pending email change",
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: MeDtoSchema },
          },
        },
      },
    },
    patch: {
      tags: [tag],
      summary: "Updates the current user's profile",
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: UpdateProfileDtoSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: MeDtoSchema },
          },
        },
      },
    },
  },
  "/users/me/email-change": {
    post: {
      tags: [tag],
      summary: "Requests a change of the current user's email address",
      description: "Rate limited to 3 requests per hour per user/IP.",
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: RequestEmailChangeDtoSchema },
        },
      },
      responses: {
        [HTTPCode.ACCEPTED]: {
          content: {
            [ContentType.JSON]: { schema: MeDtoSchema },
          },
        },
      },
    },
    delete: {
      tags: [tag],
      summary: "Cancels the current user's pending email change",
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: MeDtoSchema },
          },
        },
      },
    },
  },
  "/users/email-change/revoke": {
    post: {
      tags: [tag],
      summary: "Revokes a pending email change via a signed token",
      description:
        "Anonymous. POST (not GET) so mail link-scanners cannot auto-cancel a pending change by prefetching the link.",
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: RevokeEmailChangeBodySchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: RevokeResultSchema },
          },
        },
      },
    },
  },
  "/users/email-change/revoke/info": {
    get: {
      tags: [tag],
      summary: "Returns context for a pending email change revoke token",
      description: "Anonymous. Side-effect-free lookup used by the confirmation page.",
      parameters: [RevokeTokenQueryParamSchema],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: RevokeInfoSchema },
          },
        },
      },
    },
  },
  "/users/{id}/role": {
    patch: {
      tags: [tag],
      parameters: [IdParamSchema],
      summary: "Sets the role of a user",
      description: "Admin only.",
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: SetUserRoleDtoSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: UserDtoSchema },
          },
        },
      },
    },
  },
  "/users/me/invitations": {
    get: {
      tags: [tag],
      parameters: [InvitationStatusQueryParamSchema],
      summary: "Returns invitations for the current user",
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: InvitationResponseSchema.array() },
          },
        },
      },
    },
  },
};
