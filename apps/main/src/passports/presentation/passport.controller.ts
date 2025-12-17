import type express from "express";
import type { SubmodelElementRequestDto } from "../../aas/presentation/dto/submodel-element.dto";
import type { SubmodelRequestDto } from "../../aas/presentation/dto/submodel.dto";
import { Controller } from "@nestjs/common";
import { Pagination } from "../../aas/domain/pagination";

import { IdShortPath } from "../../aas/domain/submodel-base/submodel-base";
import {
  ApiGetShells,
  ApiGetSubmodelById,
  ApiGetSubmodelElementById,
  ApiGetSubmodelElements,
  ApiGetSubmodelElementValue,
  ApiGetSubmodels,
  ApiGetSubmodelValue,
  ApiPostSubmodel,
  ApiPostSubmodelElement,
  CursorQueryParam,
  IdParam,
  IdShortPathParam,
  LimitQueryParam,
  RequestParam,
  SubmodelElementRequestBody,
  SubmodelIdParam,
  SubmodelRequestBody,
} from "../../aas/presentation/aas.decorators";
import { IAasCreateEndpoints, IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import { AssetAdministrationShellResponseDto } from "../../aas/presentation/dto/asset-administration-shell.dto";
import {
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
} from "../../aas/presentation/dto/submodel-element.dto";
import { SubmodelPaginationResponseDto, SubmodelResponseDto } from "../../aas/presentation/dto/submodel.dto";
import { ValueResponseDto } from "../../aas/presentation/dto/value-response.dto";
import { EnvironmentService, loadEnvironmentAndCheckOwnership } from "../../aas/presentation/environment.service";
import { AuthService } from "../../auth/auth.service";
import { PassportRepository } from "../infrastructure/passport.repository";

@Controller("/passports")
export class PassportController implements IAasReadEndpoints, IAasCreateEndpoints {
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

  @ApiPostSubmodel()
  async createSubmodel(
    @IdParam() id: string,
    @SubmodelRequestBody() body: SubmodelRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    return await this.environmentService.addSubmodelToEnvironment(environment, body);
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

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @RequestParam() req: express.Request,
  ): Promise<ValueResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    return await this.environmentService.getSubmodelValue(environment, submodelId);
  }

  @ApiPostSubmodelElement()
  async createSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    return await this.environmentService.addSubmodelElement(environment, submodelId, body);
  }

  @ApiGetSubmodelElements()
  async getSubmodelElements(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined, @RequestParam()
    req: express.Request,
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

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<ValueResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.passportRepository, id, req);
    return await this.environmentService.getSubmodelElementValue(environment, submodelId, idShortPath);
  }
}
