import {
  ApiKeyDtoSchema,
  ApiKeyPaginationDtoSchema,
  CreateApiKeyDtoSchema,
  CreatedApiKeyDtoSchema,
  UpdateApiKeyDtoSchema,
} from "@open-dpp/dto";
import { z } from "zod";
import { CursorQueryParamSchema } from "../aas/presentation/aas.decorators";
import { LimitQueryParamSchema } from "../digital-product-document/presentation/digital-product-document-decorators";
import { ContentType } from "./content.types";
import { HTTPCode } from "./http.codes";

const tag = "api-keys";
// Key management deliberately rejects x-api-key auth (403); browser session only.
const security = [{ sessionAuth: [] }];

const apiKeyIdParamSchema = z.string().meta({
  description: "The api key id",
  param: { in: "path", name: "id" },
});

export const apiKeyPaths = {
  "/users/me/api-keys": {
    get: {
      tags: [tag],
      summary: "Returns a page of the current user's api keys",
      description: "Keys are masked; only the stored starting characters are returned.",
      parameters: [LimitQueryParamSchema, CursorQueryParamSchema],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: ApiKeyPaginationDtoSchema },
          },
        },
      },
      security,
    },
    post: {
      tags: [tag],
      summary: "Creates an api key for the current user",
      description:
        "The plain key is returned exactly once in the response. It cannot be retrieved again.",
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: CreateApiKeyDtoSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: CreatedApiKeyDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/users/me/api-keys/{id}": {
    patch: {
      tags: [tag],
      summary: "Renames an api key of the current user",
      parameters: [apiKeyIdParamSchema],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: UpdateApiKeyDtoSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: ApiKeyDtoSchema },
          },
        },
      },
      security,
    },
    delete: {
      tags: [tag],
      summary: "Revokes an api key of the current user",
      parameters: [apiKeyIdParamSchema],
      responses: {
        [HTTPCode.NO_CONTENT]: {
          description: "The api key was revoked",
        },
      },
      security,
    },
  },
};
