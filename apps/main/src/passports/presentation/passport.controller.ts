import type { SubmodelElementRequestDto, SubmodelRequestDto } from "@open-dpp/dto";
import type express from "express";
import { Controller } from "@nestjs/common";
import { AssetAdministrationShellPaginationResponseDto, SubmodelElementPaginationResponseDto, SubmodelElementResponseDto, SubmodelPaginationResponseDto, SubmodelResponseDto, ValueResponseDto } from "@open-dpp/dto";

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
  ApiPostSubmodelElementAtIdShortPath,
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
import {
  checkOwnerShipOfDppIdentifiable,
  EnvironmentService,
} from "../../aas/presentation/environment.service";
import { AuthService } from "../../identity/auth/application/services/auth.service";
import { Pagination } from "../../pagination/pagination";
import { Passport } from "../domain/passport";
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
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(passport.getEnvironment(), pagination);
  }

  @ApiGetSubmodels()
  async getSubmodels(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelPaginationResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(passport.getEnvironment(), pagination);
  }

  @ApiPostSubmodel()
  async createSubmodel(
    @IdParam() id: string,
    @SubmodelRequestBody() body: SubmodelRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.addSubmodelToEnvironment(passport.getEnvironment(), body, this.saveEnvironmentCallback(passport));
  }

  @ApiGetSubmodelById()
  async getSubmodelById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.getSubmodelById(passport.getEnvironment(), submodelId);
  }

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @RequestParam() req: express.Request,
  ): Promise<ValueResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.getSubmodelValue(passport.getEnvironment(), submodelId);
  }

  @ApiPostSubmodelElement()
  async createSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.addSubmodelElement(passport.getEnvironment(), submodelId, body);
  }

  @ApiGetSubmodelElements()
  async getSubmodelElements(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined, @RequestParam()
    req: express.Request,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(passport.getEnvironment(), submodelId, pagination);
  }

  @ApiGetSubmodelElementById()
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.getSubmodelElementById(passport.getEnvironment(), submodelId, idShortPath);
  }

  @ApiPostSubmodelElementAtIdShortPath()
  async createSubmodelElementAtIdShortPath(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.addSubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<ValueResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.getSubmodelElementValue(passport.getEnvironment(), submodelId, idShortPath);
  }

  private async loadPassportAndCheckOwnership(authService: AuthService, id: string, req: express.Request): Promise<Passport> {
    const passport = await this.passportRepository.findOneOrFail(id);
    return checkOwnerShipOfDppIdentifiable(passport, authService, req);
  }

  private saveEnvironmentCallback(passport: Passport) {
    return async () => {
      await this.passportRepository.save(passport);
    };
  }
}
