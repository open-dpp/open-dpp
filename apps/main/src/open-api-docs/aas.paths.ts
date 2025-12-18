import { SubmodelElementSchema, SubmodelJsonSchema } from "@open-dpp/aas";
import {
  ApiGetShellsPath,
  ApiGetSubmodelByIdPath,
  ApiGetSubmodelElementByIdPath,
  ApiGetSubmodelElementValuePath,
  ApiGetSubmodelValuePath,
  ApiSubmodelElementsPath,
  ApiSubmodelsPath,
  CursorQueryParamSchema,
  IdParamSchema,
  IdShortPathParamSchema,
  LimitQueryParamSchema,
  SubmodelIdParamSchema,
} from "../aas/presentation/aas.decorators";
import {
  AssetAdministrationShellPaginationResponseDtoSchema,
} from "../aas/presentation/dto/asset-administration-shell.dto";
import { SubmodelElementPaginationResponseDtoSchema } from "../aas/presentation/dto/submodel-element.dto";
import { SubmodelPaginationResponseDtoSchema, SubmodelRequestDtoSchema } from "../aas/presentation/dto/submodel.dto";
import { ValueResponseDtoSchema } from "../aas/presentation/dto/value-response.dto";
import { TemplateDtoSchema } from "../templates/presentation/dto/template.dto";

const HTTPCode = {
  OK: 200,
  CREATED: 201,
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
    },
    [`${tag}${ApiGetSubmodelValuePath}`]: {
      get: {
        tags: [tag],
        summary: `Returns Submodel value representation`,
        parameters: [IdParamSchema, SubmodelIdParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: ValueResponseDtoSchema },
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
    },
    [`${tag}${ApiGetSubmodelElementValuePath}`]: {
      get: {
        tags: [tag],
        summary: `Returns value representation of Submodel Element`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: ValueResponseDtoSchema },
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
