import type express from "express";
import { applyDecorators, ForbiddenException, Get, Param, Query, Req } from "@nestjs/common";

import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import { fromNodeHeaders } from "better-auth/node";
import { AuthService } from "../../auth/auth.service";
import { Environment } from "../domain/environment";
import {
  IDigitalProductPassportIdentifiableRepository,
} from "../infrastructure/digital-product-passport-identifiable.repository";
import { AssetAdministrationShellResponseDto } from "./dto/asset-administration-shell.dto";

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

export const IdParam = () => Param("id");
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
