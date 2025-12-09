import type express from "express";
import { Controller } from "@nestjs/common";
import { Pagination } from "../../aas/domain/pagination";

import { IdShortPath } from "../../aas/domain/submodel-base/submodel";
import {
  ApiGetShells,
  ApiGetSubmodelById,
  ApiGetSubmodelElementById,
  ApiGetSubmodelElements,
  ApiGetSubmodels,
  CursorQueryParam,
  IdParam,
  IdShortPathParam,
  LimitQueryParam,
  RequestParam,
  SubmodelIdParam,
} from "../../aas/presentation/aas.decorators";
import { IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import {
  AssetAdministrationShellResponseDto,
} from "../../aas/presentation/dto/asset-administration-shell.dto";
import {
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
} from "../../aas/presentation/dto/submodel-element.dto";
import { SubmodelPaginationResponseDto, SubmodelResponseDto } from "../../aas/presentation/dto/submodel.dto";
import { EnvironmentService, loadEnvironmentAndCheckOwnership } from "../../aas/presentation/environment.service";
import { AuthService } from "../../auth/auth.service";
import { PassportRepository } from "../infrastructure/passport.repository";

@Controller("/passports")
export class PassportController implements IAasReadEndpoints {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly authService: AuthService,
    private readonly passportRepository: PassportRepository,
  ) {
  }

  @ApiGetShells()
  async getShells(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @RequestParam() req: express.Request,
  ): Promise<AssetAdministrationShellResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(environment, pagination);
  }

  @ApiGetSubmodels()
  async getSubmodels(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelPaginationResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(environment, pagination);
  }

  @ApiGetSubmodelById()
  async getSubmodelById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    return await this.environmentService.getSubmodelById(environment, submodelId);
  }

  @ApiGetSubmodelElements()
  async getSubmodelElements(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(environment, submodelId, pagination);
  }

  @ApiGetSubmodelElementById()
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    return await this.environmentService.getSubmodelElementById(environment, submodelId, idShortPath);
  }
}
