import type express from "express";
import { Controller, Param, Req } from "@nestjs/common";
import { AuthService } from "../../auth/auth.service";
import { Pagination } from "../domain/pagination";
import { TemplateRepository } from "../infrastructure/template.repository";
import {
  AasWrapper,
  ApiGetShells,
  CursorQueryParam,
  LimitQueryParam,
  loadEnvironmentAndCheckOwnership,
} from "./aas.decorators";
import { IAasReadEndpoints } from "./aas.endpoints";
import {
  AssetAdministrationShellResponseDto,
} from "./dto/asset-administration-shell.dto";
import { EnvironmentService } from "./environment.service";

@Controller("/templates")
export class TemplateController implements IAasReadEndpoints {
  constructor(private readonly environmentService: EnvironmentService, private readonly authService: AuthService, private readonly templateRepository: TemplateRepository) {
  }

  @ApiGetShells(AasWrapper.Template)
  async getShells(@Param("id") id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @Req() req: express.Request): Promise<AssetAdministrationShellResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(environment, pagination);
  }
}
