import type express from "express";
import { applyDecorators, ForbiddenException, Get, Param, Req } from "@nestjs/common";

import { ApiOkResponse, ApiOperation, ApiParam } from "@nestjs/swagger";
import { fromNodeHeaders } from "better-auth/node";
import { AuthService } from "../../auth/auth.service";
import { Environment } from "../domain/environment";
import {
  IDigitalProductPassportIdentifiableRepository,
} from "../infrastructure/digital-product-passport-identifiable.repository";
import { AssetAdministrationShellResponseDto } from "./dto/asset-administration-shell.dto";

export function ApiGetShells(idDescription: string) {
  return applyDecorators(
    ApiOperation({
      summary: "Get shells",
      description: `Get shells`,
    }),
    ApiOkResponse({
      type: AssetAdministrationShellResponseDto,
    }),
    ApiParam({
      name: "id",
      type: String,
      required: true,
      description: idDescription,
    }),
    Get("/:id/shells"),
  );
}

export const IdParam = () => Param("id");
export const RequestParam = () => Req();

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
