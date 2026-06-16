import {
  CreateGs1UniqueProductIdentifierRequestSchema,
  UniqueProductIdentifierListItemDtoSchema,
  UniqueProductIdentifierPaginationDtoSchema,
  UpdateGs1UniqueProductIdentifierRequestSchema,
} from "@open-dpp/dto";
import { CursorQueryParamSchema } from "../aas/presentation/aas.decorators";
import { LimitQueryParamSchema } from "../digital-product-document/presentation/digital-product-document-decorators";
import { ContentType } from "./content.types";
import { HTTPCode } from "./http.codes";
import { z } from "zod";

const security = [{ apiKeyAuth: [] }];
const orgaIdHeader = { $ref: "#/components/parameters/OrganizationIdHeader" };

const upiIdParamSchema = z.uuid().meta({
  description: "The unique product identifier UUID",
  example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  param: { in: "path", name: "id" },
});

const passportIdParamSchema = z.uuid().meta({
  description: "The passport UUID",
  example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  param: { in: "path", name: "id" },
});

export const uniqueProductIdentifierPaths = {
  "/unique-product-identifiers": {
    get: {
      tags: ["unique-product-identifiers"],
      summary:
        "Returns a page of unique product identifiers for the organization (system + GS1)",
      parameters: [LimitQueryParamSchema, CursorQueryParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: UniqueProductIdentifierPaginationDtoSchema },
          },
        },
      },
      security,
    },
    post: {
      tags: ["unique-product-identifiers"],
      summary: "Creates a new GS1 unique product identifier for a draft passport",
      parameters: [orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: {
            schema: CreateGs1UniqueProductIdentifierRequestSchema,
          },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: {
              schema: UniqueProductIdentifierListItemDtoSchema,
            },
          },
        },
      },
      security,
    },
  },
  "/unique-product-identifiers/{id}": {
    get: {
      tags: ["unique-product-identifiers"],
      summary: "Returns a unique product identifier by UUID",
      parameters: [upiIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: {
              schema: UniqueProductIdentifierListItemDtoSchema,
            },
          },
        },
      },
      security,
    },
    patch: {
      tags: ["unique-product-identifiers"],
      summary:
        "Updates a GS1 unique product identifier (gtin/batch/serial) — draft passport only",
      parameters: [upiIdParamSchema, orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: {
            schema: UpdateGs1UniqueProductIdentifierRequestSchema,
          },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: {
              schema: UniqueProductIdentifierListItemDtoSchema,
            },
          },
        },
      },
      security,
    },
    delete: {
      tags: ["unique-product-identifiers"],
      summary:
        "Deletes a GS1 unique product identifier — draft passport only; system rows rejected",
      parameters: [upiIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.NO_CONTENT]: {},
      },
      security,
    },
  },
  // Passport-scoped list (system + GS1)
  "/passports/{id}/unique-product-identifiers": {
    get: {
      tags: ["unique-product-identifiers"],
      summary:
        "Returns a page of unique product identifiers for a passport (system + GS1)",
      parameters: [
        passportIdParamSchema,
        LimitQueryParamSchema,
        CursorQueryParamSchema,
        orgaIdHeader,
      ],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: UniqueProductIdentifierPaginationDtoSchema },
          },
        },
      },
      security,
    },
  },
};
