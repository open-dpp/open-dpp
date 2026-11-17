import {
  CARRIER_EXPORT_CONTENT_TYPES,
  CarrierExportQuerySchema,
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
import { MAX_PNG_EDGE_PX } from "../permalink/domain/data-carrier";
import { CARRIER_EXPORT_RATE_LIMIT } from "../permalink/presentation/carrier-export.controller";
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

const carrierShape = CarrierExportQuerySchema.shape;

/** The validation schema itself, so limits, enums and defaults can't drift from the docs. */
const carrierExportQuerySchema = CarrierExportQuerySchema.extend({
  format: carrierShape.format.meta({
    description: "File format. SVG is vector and ignores dpi; PNG is rendered at dpi.",
  }),
  moduleSize: carrierShape.moduleSize.meta({
    description: "Module size (X-dimension) in mm: the printed edge length of one QR module.",
  }),
  dpi: carrierShape.dpi.meta({
    description:
      "Resolution of a PNG in dots per inch. Validated for every format, used only for PNG.",
  }),
  errorCorrection: carrierShape.errorCorrection.meta({
    description:
      "QR Code error-correction level. L, M, Q and H restore about 7 %, 15 %, 25 % and 30 % of the symbol.",
  }),
});

const binaryFileSchema = { type: "string", format: "binary" } as const;

const carrierExportContent = Object.fromEntries(
  Object.values(CARRIER_EXPORT_CONTENT_TYPES).map((type) => [type, { schema: binaryFileSchema }]),
);

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
      summary: "Updates a permalink (slug, baseUrl, gs1DataAttributes) by id",
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
  "/permalinks/{id}/carrier": {
    get: {
      tags: ["permalinks"],
      summary: "Downloads the QR Code of a permalink as a print-ready SVG or PNG",
      description: [
        "The QR Code encodes the permalink's public URL and keeps a quiet zone of four modules on every side.",
        "Only Members of the organization that owns the permalink's passport may call this; the organization header is not read.",
        "If the passport is published, the permalink's public URL is frozen first, so the printed code keeps resolving.",
        `Each user may export ${CARRIER_EXPORT_RATE_LIMIT.limit} times per ${CARRIER_EXPORT_RATE_LIMIT.ttl / 1000} seconds.`,
      ].join(" "),
      parameters: [permalinkIdParamSchema],
      requestParams: { query: carrierExportQuerySchema },
      responses: {
        [HTTPCode.OK]: {
          description: "The Carrier Export file",
          headers: {
            "Content-Disposition": {
              description: 'attachment; filename="data-carrier-<slug or id>.<format>"',
              schema: { type: "string" },
            },
          },
          content: carrierExportContent,
        },
        [HTTPCode.BAD_REQUEST]: {
          description: `A setting is invalid, or the PNG would exceed ${MAX_PNG_EDGE_PX} px per side`,
        },
        [HTTPCode.FORBIDDEN]: {
          description:
            "The caller is anonymous or not a Member of the organization that owns the passport",
        },
        [HTTPCode.NOT_FOUND]: {
          description: "The permalink or its passport does not exist",
        },
        [HTTPCode.TOO_MANY_REQUESTS]: {
          description: "The caller used up the export rate limit",
        },
      },
      security,
    },
  },
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
