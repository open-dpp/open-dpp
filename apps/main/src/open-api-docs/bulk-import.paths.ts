import {
  BulkImportConfigCreateDtoSchema,
  BulkImportConfigDtoSchema,
  BulkImportConfigPaginationDtoSchema,
  BulkImportConfigUpdateDtoSchema,
  BulkImportParseResultDtoSchema,
  BulkImportRunCreateDtoSchema,
  BulkImportRunDtoSchema,
  BulkImportRunItemPaginationDtoSchema,
  BulkImportRunPaginationDtoSchema,
} from "@open-dpp/dto";
import { HTTPCode } from "./http.codes";
import { ContentType } from "./content.types";
import { z } from "zod";
import { LimitQueryParamSchema } from "../digital-product-document/presentation/digital-product-document-decorators";
import { CursorQueryParamSchema } from "../aas/presentation/aas.decorators";

const security = [{ apiKeyAuth: [] }];
const orgaIdHeader = { $ref: "#/components/parameters/OrganizationIdHeader" };
const bulkImportTag = "bulk-import";

// Parameter schemas for bulk import endpoints
export const ConfigIdParamSchema = z.uuid().meta({
  description: "The bulk import configuration id",
  example: "958b741c-c2ef-4366-a134-fafd30210ed4",
  param: { in: "path", name: "configId" },
});

export const RunIdParamSchema = z.uuid().meta({
  description: "The bulk import run id",
  example: "958b741c-c2ef-4366-a134-fafd30210ed4",
  param: { in: "path", name: "id" },
});

// Query parameter schemas
export const TemplateIdQueryParamSchema = z
  .uuid()
  .optional()
  .meta({
    description: "Filter configurations by template id",
    example: "958b741c-c2ef-4366-a134-fafd30210ed4",
    param: { in: "query", name: "templateId" },
  });

const UploadSchema = z.object({
  file: z.string().meta({
    type: "string",
    format: "binary",
    description: "CSV, Excel or JSON file to upload",
  }),
});

const encoding = {
  file: {
    contentType:
      "text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json",
  },
};

// Bulk import configuration paths
export const bulkImportConfigPaths = {
  "/bulk-import/configs": {
    post: {
      tags: [bulkImportTag],
      summary: "Create a new bulk import configuration",
      parameters: [orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: BulkImportConfigCreateDtoSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportConfigDtoSchema },
          },
        },
      },
      security,
    },
    get: {
      tags: [bulkImportTag],
      summary: "Get all bulk import configurations for the organization",
      parameters: [TemplateIdQueryParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportConfigPaginationDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/bulk-import/configs/{configId}": {
    get: {
      tags: [bulkImportTag],
      summary: "Get a bulk import configuration by id",
      parameters: [ConfigIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportConfigDtoSchema },
          },
        },
      },
      security,
    },
    put: {
      tags: [bulkImportTag],
      summary: "Update a bulk import configuration",
      parameters: [ConfigIdParamSchema, orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: BulkImportConfigUpdateDtoSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportConfigDtoSchema },
          },
        },
      },
      security,
    },
    delete: {
      tags: [bulkImportTag],
      summary: "Delete a bulk import configuration",
      parameters: [ConfigIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.NO_CONTENT]: {},
      },
      security,
    },
  },
};

// Bulk import run paths
export const bulkImportRunPaths = {
  "/bulk-import/configs/{configId}/runs": {
    post: {
      tags: [bulkImportTag],
      summary: "Create a new bulk import run for a configuration",
      parameters: [ConfigIdParamSchema, orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: BulkImportRunCreateDtoSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportRunDtoSchema },
          },
        },
      },
      security,
    },
    get: {
      tags: [bulkImportTag],
      summary: "Get all runs for a bulk import configuration",
      parameters: [
        ConfigIdParamSchema,
        LimitQueryParamSchema,
        CursorQueryParamSchema,
        orgaIdHeader,
      ],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportRunPaginationDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/bulk-import/configs/{configId}/runs/upload": {
    post: {
      tags: [bulkImportTag],
      summary: "Create a new bulk import run from a file upload",
      description:
        "Uploads and parses a CSV or Excel file to create a bulk import run. The file is processed in memory.",
      parameters: [ConfigIdParamSchema, orgaIdHeader],
      requestBody: {
        content: {
          ["multipart/form-data"]: { schema: UploadSchema, encoding },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportRunDtoSchema },
          },
        },
        [HTTPCode.BAD_REQUEST]: {
          description: "Invalid file format or size",
        },
      },
      security,
    },
  },
  "/bulk-import/runs/{id}": {
    get: {
      tags: [bulkImportTag],
      summary: "Get a bulk import run by id",
      parameters: [RunIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportRunDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/bulk-import/runs/{id}/items": {
    get: {
      tags: [bulkImportTag],
      summary: "Get all items for a bulk import run",
      description: "Returns paginated list of items with their processing status and results",
      parameters: [RunIdParamSchema, LimitQueryParamSchema, CursorQueryParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportRunItemPaginationDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/bulk-import/runs/{id}/interrupt": {
    post: {
      tags: [bulkImportTag],
      summary: "Interrupt a running bulk import run",
      description:
        "Stops a currently processing bulk import run. The run will be marked as interrupted and no further items will be processed.",
      parameters: [RunIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BulkImportRunDtoSchema },
          },
        },
        [HTTPCode.BAD_REQUEST]: {
          description: "Run cannot be interrupted (e.g., already completed or not running)",
          content: {
            [ContentType.JSON]: {
              schema: {
                type: "object",
                properties: {
                  statusCode: { type: "number", example: 400 },
                  message: { type: "string" },
                  error: { type: "string", example: "Bad Request" },
                },
              },
            },
          },
        },
      },
      security,
    },
  },
};

// Bulk import file parser paths
export const bulkImportFileParserPaths = {
  "/bulk-import/parse-file": {
    post: {
      tags: [bulkImportTag],
      summary: "Parse a bulk import file for preview",
      description:
        "Parses a CSV or Excel file and returns the extracted rows without creating a bulk import run. Useful for previewing file content before import.",
      parameters: [orgaIdHeader],
      requestBody: {
        content: {
          "multipart/form-data": { schema: UploadSchema, encoding },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: {
              schema: BulkImportParseResultDtoSchema,
            },
          },
        },
        [HTTPCode.BAD_REQUEST]: {
          description: "Invalid file format or size",
        },
      },
      security,
    },
  },
};

// Combined bulk import paths
export const bulkImportPaths = {
  ...bulkImportConfigPaths,
  ...bulkImportRunPaths,
  ...bulkImportFileParserPaths,
};
