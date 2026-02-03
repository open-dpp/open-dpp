import {
  AssetAdministrationShellPaginationResponseDtoSchema,
  SubmodelElementListJsonSchema,
  SubmodelElementModificationSchema,
  SubmodelElementPaginationResponseDtoSchema,
  SubmodelElementSchema,
  SubmodelJsonSchema,
  SubmodelModificationSchema,
  SubmodelPaginationResponseDtoSchema,
  SubmodelRequestDtoSchema,
  TemplateDtoSchema,
  TemplatePaginationDtoSchema,
  ValueSchema,
} from "@open-dpp/dto";
import {
  ApiDeleteRowPath,
  ApiGetColumnByIdShortPath,
  ApiGetShellsPath,
  ApiGetSubmodelByIdPath,
  ApiGetSubmodelElementByIdPath,
  ApiGetSubmodelElementValuePath,
  ApiGetSubmodelValuePath,
  ApiPostColumnPath,
  ApiPostRowPath,
  ApiSubmodelElementsPath,
  ApiSubmodelsPath,
  ColumnParamSchema,
  CursorQueryParamSchema,
  IdParamSchema,
  IdShortPathParamSchema,
  LimitQueryParamSchema,
  PositionQueryParamSchema,
  RowParamSchema,
  SubmodelIdParamSchema,
} from "../aas/presentation/aas.decorators";

const HTTPCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
} as const;

const ContentType = {
  JSON: "application/json",
} as const;

export function createAasPaths(tag: string) {
  return {
    [`${tag}${ApiGetShellsPath}`]: {
      get: {
        tags: [tag],
        summary: "Returns all Asset Administration Shells",
        parameters: [IdParamSchema, LimitQueryParamSchema, CursorQueryParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: AssetAdministrationShellPaginationResponseDtoSchema },
            },
          },
        },
      },
    },
    [`${tag}${ApiSubmodelsPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns all Submodels of the ${tag}`,
        parameters: [IdParamSchema, LimitQueryParamSchema, CursorQueryParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelPaginationResponseDtoSchema },
            },
          },
        },
      },
      post: {
        operationId: "createSubmodel",
        tags: [tag],
        summary: `Creates submodel for ${tag.slice(0, -1)}`,
        parameters: [IdParamSchema],
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
      },
      patch: {
        operationId: "patchSubmodel",
        tags: [tag],
        summary: `Modify submodel with id`,
        parameters: [IdParamSchema, SubmodelIdParamSchema],
        requestBody: {
          content: {
            [ContentType.JSON]: { schema: SubmodelModificationSchema },
          },
        },
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelJsonSchema },
            },
          },
        },
      },
    },
    [`${tag}${ApiGetSubmodelByIdPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns Submodel by id`,
        parameters: [IdParamSchema, SubmodelIdParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelJsonSchema },
            },
          },
        },
      },
      delete: {
        tags: [tag],
        summary: `Deletes Submodel by id`,
        parameters: [IdParamSchema, SubmodelIdParamSchema],
        responses: {
          [HTTPCode.NO_CONTENT]: {},
        },
      },
    },
    [`${tag}${ApiGetSubmodelValuePath}`]: {
      get: {
        tags: [tag],
        summary: `Returns Submodel value representation`,
        parameters: [IdParamSchema, SubmodelIdParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: ValueSchema },
            },
          },
        },
      },
    },
    [`${tag}${ApiSubmodelElementsPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns all Submodel Elements of the given Submodel`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, LimitQueryParamSchema, CursorQueryParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementPaginationResponseDtoSchema },
            },
          },
        },
      },
      post: {
        tags: [tag],
        summary: `Add Submodel Element to the given Submodel`,
        parameters: [IdParamSchema, SubmodelIdParamSchema],
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
      },
    },
    [`${tag}${ApiPostColumnPath}`]: {
      post: {
        tags: [tag],
        summary: `Add column to Submodel Element List with specified idShortPath. Column is itself a Submodel Element.`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, PositionQueryParamSchema],
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
      },
    },
    [`${tag}${ApiGetColumnByIdShortPath}`]: {
      delete: {
        tags: [tag],
        summary: "Deletes column with specified idShort from Submodel Element List with specified idShortPath.",
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, ColumnParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementListJsonSchema },
            },
          },
        },
      },
      patch: {
        tags: [tag],
        summary: "Modifies column with specified idShort of Submodel Element List with specified idShortPath.",
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, ColumnParamSchema],
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
      },
    },
    [`${tag}${ApiPostRowPath}`]: {
      post: {
        tags: [tag],
        summary: `Add row to Submodel Element List with specified idShortPath.`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, PositionQueryParamSchema],
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
      },
    },
    [`${tag}${ApiDeleteRowPath}`]: {
      post: {
        tags: [tag],
        summary: `Deletes row with specified idShort from Submodel Element List with specified idShortPath.`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema, RowParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementListJsonSchema },
            },
          },
        },
      },
    },
    [`${tag}${ApiGetSubmodelElementByIdPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns Submodel Element by idShortPath`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementSchema },
            },
          },
        },
      },
      post: {
        tags: [tag],
        summary: `Creates a new Submodel Element at a specified path within submodel elements hierarchy`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema],
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
      },
      patch: {
        tags: [tag],
        summary: `Modify Submodel Element`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema],
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
      },
      delete: {
        tags: [tag],
        summary: `Deletes a Submodel Element at a specified path within submodel elements hierarchy`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema],
        responses: {
          [HTTPCode.NO_CONTENT]: {},
        },
      },
    },
    [`${tag}${ApiGetSubmodelElementValuePath}`]: {
      get: {
        tags: [tag],
        summary: `Returns value representation of Submodel Element`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: ValueSchema },
            },
          },
        },
      },
    },
  };
}

function createTemplatePaths() {
  const tag = "templates";
  return {
    ...createAasPaths(tag),
    [`${tag}`]: {
      get: {
        tags: [tag],
        summary: `Get templates`,
        parameters: [LimitQueryParamSchema, CursorQueryParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: TemplatePaginationDtoSchema },
            },
          },
        },
      },
      post: {
        tags: [tag],
        summary: `Creates template`,
        responses: {
          [HTTPCode.CREATED]: {
            content: {
              [ContentType.JSON]: { schema: TemplateDtoSchema },
            },
          },
        },
      },
    },
  };
}

export const aasPaths = {
  ...createAasPaths("passports"),
  ...createTemplatePaths(),
};
