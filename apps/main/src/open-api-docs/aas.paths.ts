import { SubmodelJsonSchema } from "../aas/domain/parsing/submodel-base/submodel-json-schema";
import {
  ApiGetShellsPath,
  ApiGetSubmodelByIdPath,
  ApiGetSubmodelElementsPath,
  ApiGetSubmodelsPath,
  cursorQueryParamSchema,
  IdParamSchema,
  limitQueryParamSchema,
  SubmodelIdParamSchema,
} from "../aas/presentation/aas.decorators";
import {
  AssetAdministrationShellPaginationResponseDtoSchema,
} from "../aas/presentation/dto/asset-administration-shell.dto";
import { SubmodelElementPaginationResponseDtoSchema } from "../aas/presentation/dto/submodel-element.dto";
import { SubmodelPaginationResponseDtoSchema } from "../aas/presentation/dto/submodel.dto";

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
        parameters: [IdParamSchema, limitQueryParamSchema, cursorQueryParamSchema],
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
        parameters: [IdParamSchema, limitQueryParamSchema, cursorQueryParamSchema],
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
        parameters: [IdParamSchema, limitQueryParamSchema, cursorQueryParamSchema],
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
    [`${tag}${ApiGetSubmodelElementsPath}`]: {
      get: {
        tags: [tag],
        summary: `Returns all Submodel Elements of the given Submodel`,
        parameters: [IdParamSchema, SubmodelIdParamSchema, limitQueryParamSchema, cursorQueryParamSchema],
        responses: {
          [HTTPCode.OK]: {
            content: {
              [ContentType.JSON]: { schema: SubmodelElementPaginationResponseDtoSchema },
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
