import type express from "express";
import { Controller, Req } from "@nestjs/common";
import { Pagination } from "../../aas/domain/pagination";
import {
  AasWrapper,
  ApiGetShells,
  ApiGetSubmodelById,
  ApiGetSubmodels,
  CursorQueryParam,
  IdParam,
  LimitQueryParam,
  loadEnvironmentAndCheckOwnership,
  RequestParam,
  SubmodelIdParam,
} from "../../aas/presentation/aas.decorators";
import { IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import { AssetAdministrationShellResponseDto } from "../../aas/presentation/dto/asset-administration-shell.dto";
import { SubmodelPaginationResponseDto, SubmodelResponseDto } from "../../aas/presentation/dto/submodel.dto";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { AuthService } from "../../auth/auth.service";
import { TemplateRepository } from "../infrastructure/template.repository";

@Controller("/templates")
export class TemplateController implements IAasReadEndpoints {
  constructor(private readonly environmentService: EnvironmentService, private readonly authService: AuthService, private readonly templateRepository: TemplateRepository) {
  }

  @ApiGetShells(AasWrapper.Template)
  async getShells(@IdParam() id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @Req() req: express.Request): Promise<AssetAdministrationShellResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(environment, pagination);
  }

  @ApiGetSubmodels(AasWrapper.Template)
  async getSubmodels(@IdParam() id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @Req() req: express.Request): Promise<SubmodelPaginationResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(environment, pagination);
  }

  @ApiGetSubmodelById(AasWrapper.Template)
  async getSubmodelById(@IdParam() id: string, @SubmodelIdParam() submodelId: string, @RequestParam() req: express.Request): Promise<SubmodelResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    return await this.environmentService.getSubmodelById(environment, submodelId);
  }
}
