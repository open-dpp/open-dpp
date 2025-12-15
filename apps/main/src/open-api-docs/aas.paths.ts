import { SubmodelBaseUnionSchema } from "../aas/domain/parsing/submodel-base/submodel-base-union-schema";
import { SubmodelJsonSchema } from "../aas/domain/parsing/submodel-base/submodel-json-schema";
import {
  ApiGetShellsPath,
  ApiGetSubmodelByIdPath,
  ApiGetSubmodelElementByIdPath,
  ApiGetSubmodelElementsPath,
  ApiGetSubmodelElementValuePath,
  ApiGetSubmodelsPath,
  ApiGetSubmodelValuePath,
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
import { SubmodelPaginationResponseDtoSchema } from "../aas/presentation/dto/submodel.dto";
import { ValueResponseDtoSchema } from "../aas/presentation/dto/value-response.dto";

const HTTPCode = {
  OK: 200,
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
    [`${tag}${ApiGetSubmodelsPath}`]: {
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
    },
    [`${tag}${ApiGetSubmodelsPath}`]: {
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
    [`${tag}${ApiGetSubmodelElementsPath}`]: {
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
    },
    [`${tag}${ApiGetSubmodelElementByIdPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns Submodel Element by idShortPath`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, IdShortPathParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelBaseUnionSchema },
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

export const aasPaths = {
  ...createAasPaths("passports"),
  ...createAasPaths("templates"),
};
