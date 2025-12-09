import type express from "express";
import { applyDecorators, ForbiddenException, Get, Param, Query, Req } from "@nestjs/common";

import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import { ZodValidationPipe } from "@open-dpp/exception";
import { fromNodeHeaders } from "better-auth/node";
import { AuthService } from "../../auth/auth.service";
import { IdDtoSchema, IdShortPathDtoSchema } from "../../identification/id.dto";
import { Environment } from "../domain/environment";
import {
  IDigitalProductPassportIdentifiableRepository,
} from "../infrastructure/digital-product-passport-identifiable.repository";
import { AssetAdministrationShellResponseDto } from "./dto/asset-administration-shell.dto";
import { SubmodelElementPaginationResponseDto } from "./dto/submodel-element.dto";
import { SubmodelPaginationResponseDto, SubmodelResponseDto } from "./dto/submodel.dto";

const limitParamOpts = {
  name: "limit",
  type: Number,
  required: false,
  description: "The maximum number of elements in the response array",
};

const cursorParamOpts = {
  name: "cursor",
  type: String,
  required: false,
  description: "A server-generated identifier retrieved from pagingMetadata that specifies from which position the result listing should continue",
};

export const AasWrapper = {
  Passport: "passport",
  Template: "template",
} as const;

export type AasWrapperType = typeof AasWrapper[keyof typeof AasWrapper];

function idParamOpts(aasWrapper: AasWrapperType) {
  return {
    name: "id",
    type: String,
    required: true,
    description: `The id of the ${aasWrapper}`,
  };
}

const submodelIdParamOpts = {
  name: "submodelId",
  type: String,
  required: true,
  description: `The id of the submodel`,
};

const idShortPathParamOpts = {
  name: "idShortPath",
  type: String,
  required: true,
  description: "IdShort path to the submodel element (dot-separated)",
};

export function ApiGetShells(aasWrapper: AasWrapperType) {
  return applyDecorators(
    ApiOperation({
      summary: `Returns all Asset Administration Shells of the ${aasWrapper}`,
    }),
    ApiOkResponse({
      type: AssetAdministrationShellResponseDto,
    }),
    ApiParam(idParamOpts(aasWrapper)),
    ApiQuery(limitParamOpts),
    ApiQuery(cursorParamOpts),
    Get("/:id/shells"),
  );
}

export function ApiGetSubmodels(aasWrapper: AasWrapperType) {
  return applyDecorators(
    ApiOperation({
      summary: `Returns all Submodels of the ${aasWrapper}`,
    }),
    ApiOkResponse({
      type: SubmodelPaginationResponseDto,
    }),
    ApiParam(idParamOpts(aasWrapper)),
    ApiQuery(limitParamOpts),
    ApiQuery(cursorParamOpts),
    Get("/:id/submodels"),
  );
}

export function ApiGetSubmodelById(aasWrapper: AasWrapperType) {
  return applyDecorators(
    ApiOperation({
      summary: `Returns Submodel by id`,
    }),
    ApiOkResponse({
      type: SubmodelResponseDto,
    }),
    ApiParam(idParamOpts(aasWrapper)),
    ApiParam(submodelIdParamOpts),
    Get("/:id/submodels/:submodelId"),
  );
}

export function ApiGetSubmodelElements(aasWrapper: AasWrapperType) {
  return applyDecorators(
    ApiOperation({
      summary: `Returns all submodel elements of the given submodel`,
    }),
    ApiOkResponse({
      type: SubmodelElementPaginationResponseDto,
    }),
    ApiParam(idParamOpts(aasWrapper)),
    ApiParam(submodelIdParamOpts),
    Get("/:id/submodels/:submodelId/submodel-elements"),
  );
}

// export function ApiGetSubmodelElementById(aasWrapper: AasWrapperType) {
//   return applyDecorators(
//     ApiOperation({
//       summary: `Returns submodel element by id`,
//     }),
//     ApiOkResponse({
//       type: SubmodelElementResponseDto,
//     }),
//     ApiParam(idParamOpts(aasWrapper)),
//     ApiParam(submodelIdParamOpts),
//     ApiParam(idShortPathParamOpts),
//     Get("/:id/submodels/:submodelId/submodel-elements/:idShortPath"),
//   );
// }

export const IdParam = () => Param("id", new ZodValidationPipe(IdDtoSchema));
export const SubmodelIdParam = () => Param("submodelId", new ZodValidationPipe(IdDtoSchema));
export const IdShortPathParam = () => Param("idShortPath", new ZodValidationPipe(IdShortPathDtoSchema));

export const RequestParam = () => Req();

export const LimitQueryParam = () => Query("limit");
export const CursorQueryParam = () => Query("cursor");

export async function loadEnvironmentAndCheckOwnership(authService: AuthService, envRepository: IDigitalProductPassportIdentifiableRepository, environmentId: string, req: express.Request): Promise<Environment> {
  const dppIdentifiable = await envRepository.findOneOrFail(environmentId);
  const session = await authService.getSession(fromNodeHeaders(req.headers || []));
  if (session?.user.id && await authService.isMemberOfOrganization(session.user.id, dppIdentifiable.getOrganizationId())) {
    return dppIdentifiable.getEnvironment();
  }
  else {
    throw new ForbiddenException();
  }
}
