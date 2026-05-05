import { InvitationResponseSchema } from "@open-dpp/dto";
import { InvitationStatusQueryParamSchema } from "../identity/users/presentation/users.decorators";
import { HTTPCode } from "./http.codes";
import { ContentType } from "./content.types";

const tag = "users";

export const userPaths = {
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
