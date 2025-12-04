import type express from "express";
import { Controller } from "@nestjs/common";
import { Pagination } from "../../aas/domain/pagination";
import {
  AasWrapper,
  ApiGetShells,
  ApiGetSubmodels,
  CursorQueryParam,
  IdParam,
  LimitQueryParam,
  loadEnvironmentAndCheckOwnership,
  RequestParam,
} from "../../aas/presentation/aas.decorators";

import { IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import {
  AssetAdministrationShellResponseDto,
} from "../../aas/presentation/dto/asset-administration-shell.dto";
import { SubmodelResponseDto } from "../../aas/presentation/dto/submodel.dto";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { AuthService } from "../../auth/auth.service";
import { PassportRepository } from "../infrastructure/passport.repository";

@Controller("/passports")
export class PassportController implements IAasReadEndpoints {
  constructor(private readonly environmentService: EnvironmentService, private readonly authService: AuthService, private readonly passportRepository: PassportRepository) {
  }

  @ApiGetShells(AasWrapper.Passport)
  async getShells(@IdParam() id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @RequestParam() req: express.Request): Promise<AssetAdministrationShellResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(environment, pagination);
  }

  @ApiGetSubmodels(AasWrapper.Passport)
  async getSubmodels(@IdParam() id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @RequestParam() req: express.Request): Promise<SubmodelResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(environment, pagination);
  }
}
