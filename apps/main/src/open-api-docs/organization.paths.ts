import { InvitationResponseSchema } from "@open-dpp/dto";
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
};
