import type express from "express";
import { Controller } from "@nestjs/common";
import { AuthService } from "../../auth/auth.service";
import { Pagination } from "../domain/pagination";

import { PassportRepository } from "../infrastructure/passport.repository";
import {
  AasWrapper,
  ApiGetShells,
  CursorQueryParam,
  IdParam,
  LimitQueryParam,
  loadEnvironmentAndCheckOwnership,
  RequestParam,
} from "./aas.decorators";
import { IAasReadEndpoints } from "./aas.endpoints";
import {
  AssetAdministrationShellResponseDto,
} from "./dto/asset-administration-shell.dto";
import { EnvironmentService } from "./environment.service";

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
}
