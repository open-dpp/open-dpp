import {
  AssetAdministrationShellJsonSchema,
  AssetAdministrationShellModificationSchema,
  AssetAdministrationShellPaginationResponseDtoSchema,
  DeletePolicyDtoSchema,
  PassportDtoSchema,
  PassportPaginationDtoSchema,
  PassportRequestCreateDtoSchema,
  SubmodelElementListJsonSchema,
  SubmodelElementModificationSchema,
  SubmodelElementPaginationResponseDtoSchema,
  SubmodelElementSchema,
  SubmodelJsonSchema,
  SubmodelModificationSchema,
  SubmodelPaginationResponseDtoSchema,
  SubmodelRequestDtoSchema,
  TemplateCreateDtoSchema,
  TemplateDtoSchema,
  TemplatePaginationDtoSchema,
  ValueSchema,
} from "@open-dpp/dto";
import { aasExportSchemaJsonV1_0 } from "../aas/infrastructure/serialization/export-schemas/aas-export-v1.schema";
import {
  ApiDeletePolicyPath,
  ApiDeleteRowPath,
  ApiGetColumnByIdShortPath,
  ApiGetShellsPath,
  ApiGetSubmodelByIdPath,
  ApiGetSubmodelElementByIdPath,
  ApiGetSubmodelElementValuePath,
  ApiGetSubmodelValuePath,
  ApiPatchShellPath,
  ApiPostColumnPath,
  ApiPostRowPath,
  ApiSubmodelElementsPath,
  ApiSubmodelsPath,
  AssetAdministrationShellIdParamSchema,
  ColumnParamSchema,
  CursorQueryParamSchema,
  IdParamSchema,
  IdShortPathParamSchema,
  LimitQueryParamSchema,
  PopulateQueryParamSchema,
  PositionQueryParamSchema,
  RowParamSchema,
  SubmodelIdParamSchema,
} from "../aas/presentation/aas.decorators";

const HTTPCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
} as const;

const ContentType = {
  JSON: "application/json",
} as const;

const security = [{ apiKeyAuth: [] }];
const orgaIdHeader = { $ref: "#/components/parameters/OrganizationIdHeader" };

export function createAasPaths(tag: string) {
  return {
    [`/${tag}${ApiGetShellsPath}`]: {
      get: {
        tags: [tag],
        summary: "Returns all Asset Administration Shells",
        parameters: [IdParamSchema, LimitQueryParamSchema, CursorQueryParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: AssetAdministrationShellPaginationResponseDtoSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiPatchShellPath}`]: {
      patch: {
        tags: [tag],
        summary: "Modifies a Asset Administration Shell with specified id",
        parameters: [IdParamSchema, AssetAdministrationShellIdParamSchema, orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: AssetAdministrationShellModificationSchema },
          },
        },
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: AssetAdministrationShellJsonSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiSubmodelsPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns all Submodels of the ${tag}`,
        parameters: [IdParamSchema, LimitQueryParamSchema, CursorQueryParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelPaginationResponseDtoSchema },
            },
          },
        },
        security,
      },
      post: {
        operationId: "createSubmodel",
        tags: [tag],
        summary: `Creates submodel for ${tag.slice(0, -1)}`,
        parameters: [IdParamSchema, orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: SubmodelRequestDtoSchema },
          },
        },
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelJsonSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiGetSubmodelByIdPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns Submodel by id`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelJsonSchema },
            },
          },
        },
        security,
      },
      patch: {
        operationId: "patchSubmodel",
        tags: [tag],
        summary: `Modify submodel with id`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: SubmodelModificationSchema },
          },
        },
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelJsonSchema },
            },
          },
        },
        security,
      },
      delete: {
        tags: [tag],
        summary: `Deletes Submodel by id`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.NO_CONTENT]: {},
        },
        security,
      },
    },
    [`/${tag}${ApiGetSubmodelValuePath}`]: {
      get: {
        tags: [tag],
        summary: `Returns Submodel value representation`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: ValueSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiSubmodelElementsPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns all Submodel Elements of the given Submodel`,
        parameters: [
          IdParamSchema,
          SubmodelIdParamSchema,
          LimitQueryParamSchema,
          CursorQueryParamSchema,
          orgaIdHeader,
        ],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementPaginationResponseDtoSchema },
            },
          },
        },
        security,
      },
      post: {
        tags: [tag],
        summary: `Add Submodel Element to the given Submodel`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: SubmodelElementSchema },
          },
        },
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiPostColumnPath}`]: {
      post: {
        tags: [tag],
        summary: `Add column to Submodel Element List with specified idShortPath. Column is itself a Submodel Element.`,
        parameters: [
          IdParamSchema,
          SubmodelIdParamSchema,
          IdShortPathParamSchema,
          PositionQueryParamSchema,
          orgaIdHeader,
        ],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: SubmodelElementSchema },
          },
        },
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiGetColumnByIdShortPath}`]: {
      delete: {
        tags: [tag],
        summary:
          "Deletes column with specified idShort from Submodel Element List with specified idShortPath.",
        parameters: [
          IdParamSchema,
          SubmodelIdParamSchema,
          IdShortPathParamSchema,
          ColumnParamSchema,
          orgaIdHeader,
        ],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementListJsonSchema },
            },
          },
        },
        security,
      },
      patch: {
        tags: [tag],
        summary:
          "Modifies column with specified idShort of Submodel Element List with specified idShortPath.",
        parameters: [
          IdParamSchema,
          SubmodelIdParamSchema,
          IdShortPathParamSchema,
          ColumnParamSchema,
          orgaIdHeader,
        ],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: SubmodelElementModificationSchema },
          },
        },
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementListJsonSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiPostRowPath}`]: {
      post: {
        tags: [tag],
        summary: `Add row to Submodel Element List with specified idShortPath.`,
        parameters: [
          IdParamSchema,
          SubmodelIdParamSchema,
          IdShortPathParamSchema,
          PositionQueryParamSchema,
          orgaIdHeader,
        ],
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementListJsonSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiDeletePolicyPath}`]: {
      delete: {
        tags: [tag],
        summary: `Deletes policy for specified subject and object.`,
        parameters: [IdParamSchema, orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: DeletePolicyDtoSchema },
          },
        },
        responses: {
          [HTTPCode.NO_CONTENT]: {},
        },
        security,
      },
    },
    [`/${tag}${ApiDeleteRowPath}`]: {
      delete: {
        tags: [tag],
        summary: `Deletes row with specified idShort from Submodel Element List with specified idShortPath.`,
        parameters: [
          IdParamSchema,
          SubmodelIdParamSchema,
          IdShortPathParamSchema,
          RowParamSchema,
          orgaIdHeader,
        ],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementListJsonSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}${ApiGetSubmodelElementByIdPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns Submodel Element by idShortPath`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementSchema },
            },
          },
        },
        security,
      },
      post: {
        tags: [tag],
        summary: `Creates a new Submodel Element at a specified path within submodel elements hierarchy`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: SubmodelElementSchema },
          },
        },
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementSchema },
            },
          },
        },
        security,
      },
      patch: {
        tags: [tag],
        summary: `Modify Submodel Element`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: SubmodelElementModificationSchema },
          },
        },
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementSchema },
            },
          },
        },
        security,
      },
      delete: {
        tags: [tag],
        summary: `Deletes a Submodel Element at a specified path within submodel elements hierarchy`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.NO_CONTENT]: {},
        },
        security,
      },
    },
    [`/${tag}${ApiGetSubmodelElementValuePath}`]: {
      get: {
        tags: [tag],
        summary: `Returns value representation of Submodel Element`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: ValueSchema },
            },
          },
        },
        security,
      },
    },
  };
}

function createTemplatePaths() {
  const tag = "templates";
  return {
    ...createAasPaths(tag),
    [`/${tag}`]: {
      get: {
        tags: [tag],
        summary: `Get templates`,
        parameters: [
          LimitQueryParamSchema,
          CursorQueryParamSchema,
          PopulateQueryParamSchema,
          orgaIdHeader,
        ],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: TemplatePaginationDtoSchema },
            },
          },
        },
        security,
      },
      post: {
        tags: [tag],
        summary: `Creates template`,
        parameters: [orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: TemplateCreateDtoSchema },
          },
        },
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: TemplateDtoSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}/{id}/export`]: {
      get: {
        tags: [tag],
        summary: `Exports a template`,
        parameters: [IdParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: aasExportSchemaJsonV1_0 },
            },
          },
        },
        security,
      },
    },
    [`/${tag}/import`]: {
      post: {
        tags: [tag],
        parameters: [orgaIdHeader],
        summary: `Imports a template`,
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: aasExportSchemaJsonV1_0 },
          },
        },
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: TemplateDtoSchema },
            },
          },
          [HTTPCode.BAD_REQUEST]: {
            description: "Invalid import data format",
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
}

function createPassportPaths() {
  const tag = "passports";
  return {
    ...createAasPaths(tag),
    [`/${tag}`]: {
      get: {
        tags: [tag],
        summary: `Get passports`,
        parameters: [
          LimitQueryParamSchema,
          CursorQueryParamSchema,
          PopulateQueryParamSchema,
          orgaIdHeader,
        ],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: PassportPaginationDtoSchema },
            },
          },
        },
        security,
      },
      post: {
        tags: [tag],
        summary: `Creates blank passport`,
        parameters: [orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: PassportRequestCreateDtoSchema },
          },
        },
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: PassportDtoSchema },
            },
          },
        },
        security,
      },
    },
    [`/${tag}/{id}/export`]: {
      get: {
        tags: [tag],
        summary: `Exports a passport`,
        parameters: [IdParamSchema, orgaIdHeader],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: aasExportSchemaJsonV1_0 },
            },
          },
        },
        security,
      },
    },
    [`/${tag}/import`]: {
      post: {
        tags: [tag],
        summary: `Imports a passport`,
        parameters: [orgaIdHeader],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: aasExportSchemaJsonV1_0 },
          },
        },
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: PassportDtoSchema },
            },
          },
          [HTTPCode.BAD_REQUEST]: {
            description: "Invalid import data format",
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
}

export const aasPaths = {
  ...createPassportPaths(),
  ...createTemplatePaths(),
};
