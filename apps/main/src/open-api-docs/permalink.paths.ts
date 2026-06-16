import {
  PassportPermalinkBundleDtoSchema,
  PermalinkCreateRequestSchema,
  PermalinkListDtoSchema,
  PermalinkPaginationDtoSchema,
  PermalinkPublicDtoSchema,
  PermalinkUpdateRequestSchema,
} from "@open-dpp/dto";
import {
  CursorQueryParamSchema,
  IdOrSlugParamSchema,
  PassportIdQueryParamSchema,
} from "../aas/presentation/aas.decorators";
import { LimitQueryParamSchema } from "../digital-product-document/presentation/digital-product-document-decorators";
import { ContentType } from "./content.types";
import { HTTPCode } from "./http.codes";
import { createAasPaths } from "./digital-product-document.paths";
import { z } from "zod";

const security = [{ apiKeyAuth: [] }];
const orgaIdHeader = { $ref: "#/components/parameters/OrganizationIdHeader" };

const permalinkIdParamSchema = z.uuid().meta({
  description: "The permalink UUID",
  example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  param: { in: "path", name: "id" },
});

const passportIdParamSchema = z.uuid().meta({
  description: "The passport UUID",
  example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  param: { in: "path", name: "id" },
});

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
  // Org-scoped backoffice routes
  "/permalinks": {
    get: {
      tags: ["permalinks"],
      summary: "Returns a page of permalinks for the organization",
      parameters: [LimitQueryParamSchema, CursorQueryParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PermalinkPaginationDtoSchema },
          },
        },
      },
      security,
    },
    post: {
      tags: ["permalinks"],
      summary: "Creates a new permalink",
      parameters: [orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: PermalinkCreateRequestSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: PermalinkPublicDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/permalinks/{id}": {
    patch: {
      tags: ["permalinks"],
      summary: "Updates a permalink (slug, baseUrl, gs1ResolverBase, gs1DataAttributes) by id",
      parameters: [permalinkIdParamSchema, orgaIdHeader],
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
    delete: {
      tags: ["permalinks"],
      summary: "Deletes a permalink by id",
      parameters: [permalinkIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.NO_CONTENT]: {},
      },
      security,
    },
  },
  "/permalinks/{id}/primary": {
    post: {
      tags: ["permalinks"],
      summary: "Sets a permalink as the primary permalink for its passport",
      parameters: [permalinkIdParamSchema, orgaIdHeader],
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
  // Passport-scoped backoffice route (presentation + gs1-link union)
  "/passports/{id}/permalinks": {
    get: {
      tags: ["permalinks"],
      summary: "Returns a page of permalinks for a passport (presentation + gs1-link)",
      parameters: [
        passportIdParamSchema,
        LimitQueryParamSchema,
        CursorQueryParamSchema,
        orgaIdHeader,
      ],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PermalinkPaginationDtoSchema },
          },
        },
      },
      security,
    },
  },
};
