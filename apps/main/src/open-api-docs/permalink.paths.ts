import {
  PassportPermalinkBundleDtoSchema,
  PermalinkListDtoSchema,
  PermalinkPublicDtoSchema,
  PermalinkUpdateRequestSchema,
} from "@open-dpp/dto";
import {
  IdOrSlugParamSchema,
  PassportIdQueryParamSchema,
} from "../aas/presentation/aas.decorators";
import { ContentType } from "./content.types";
import { HTTPCode } from "./http.codes";
import { createAasPaths } from "./aas.paths";

const security = [{ apiKeyAuth: [] }];

export const permalinkPaths = {
  // AAS read surface via the permalink route prefix
  ...createAasPaths("p"),
  // Permalink-specific routes that overlap with /p/{id} from createAasPaths
  // createAasPaths does NOT generate a bare /p/{id} path so no conflict
  "/p": {
    get: {
      tags: ["permalinks"],
      summary: "Returns all public permalink URLs for a passport",
      parameters: [PassportIdQueryParamSchema],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PermalinkListDtoSchema },
          },
        },
      },
    },
  },
  "/p/{id}": {
    get: {
      tags: ["permalinks"],
      summary: "Returns a permalink bundle (passport, branding, presentation config) by id or slug",
      parameters: [IdOrSlugParamSchema],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PassportPermalinkBundleDtoSchema },
          },
        },
      },
    },
    patch: {
      tags: ["permalinks"],
      summary: "Updates a permalink (slug, baseUrl) by id",
      parameters: [IdOrSlugParamSchema],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: PermalinkUpdateRequestSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PermalinkPublicDtoSchema },
          },
        },
      },
      security,
    },
  },
};
