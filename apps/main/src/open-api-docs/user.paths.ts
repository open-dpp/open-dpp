import {
  CreateUserDtoSchema,
  InvitationResponseSchema,
  MeDtoSchema,
  RequestEmailChangeDtoSchema,
  SetUserRoleDtoSchema,
  UpdateProfileDtoSchema,
  UserDtoSchema,
} from "@open-dpp/dto";
import { IdParamSchema } from "../aas/presentation/aas.decorators";
import { InvitationStatusQueryParamSchema } from "../identity/users/presentation/users.decorators";
import { HTTPCode } from "./http.codes";
import { ContentType } from "./content.types";

const tag = "users";

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
