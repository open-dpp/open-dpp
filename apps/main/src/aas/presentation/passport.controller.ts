import type express from "express";
import { Controller } from "@nestjs/common";
import { AuthService } from "../../auth/auth.service";
import { Pagination } from "../domain/pagination";

import { PassportRepository } from "../infrastructure/passport.repository";
import { ApiGetShells, IdParam, loadEnvironmentAndCheckOwnership, RequestParam } from "./aas.decorators";
import { IAasReadEndpoints } from "./aas.endpoints";
import {
  AssetAdministrationShellResponseDto,
} from "./dto/asset-administration-shell.dto";
import { EnvironmentService } from "./environment.service";

const idDescription = "The id of the passport";
@Controller("/passports")
export class PassportController implements IAasReadEndpoints {
  constructor(private readonly environmentService: EnvironmentService, private readonly authService: AuthService, private readonly passportRepository: PassportRepository) {
  }

  @ApiGetShells(idDescription)
  async getShells(@IdParam() id: string, @RequestParam() req: express.Request): Promise<AssetAdministrationShellResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    const pagination = Pagination.create({ limit: 1 });
    return await this.environmentService.getAasShells(environment, pagination);
  }
}
