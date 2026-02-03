import type {
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementRequestDto,
  SubmodelModificationDto,
  SubmodelRequestDto,
  ValueRequestDto,
} from "@open-dpp/dto";
import type express from "express";
import { Controller } from "@nestjs/common";
import { AssetAdministrationShellPaginationResponseDto, SubmodelElementPaginationResponseDto, SubmodelElementResponseDto, SubmodelPaginationResponseDto, SubmodelResponseDto, ValueResponseDto } from "@open-dpp/dto";

import { IdShortPath, parseSubmodelElement } from "../../aas/domain/submodel-base/submodel-base";
import {
  ApiDeleteColumn,
  ApiDeleteRow,
  ApiDeleteSubmodelById,
  ApiDeleteSubmodelElementById,
  ApiGetShells,
  ApiGetSubmodelById,
  ApiGetSubmodelElementById,
  ApiGetSubmodelElements,
  ApiGetSubmodelElementValue,
  ApiGetSubmodels,
  ApiGetSubmodelValue,
  ApiPatchColumn,
  ApiPatchSubmodel,
  ApiPatchSubmodelElement,
  ApiPatchSubmodelElementValue,
  ApiPostColumn,
  ApiPostRow,
  ApiPostSubmodel,
  ApiPostSubmodelElement,
  ApiPostSubmodelElementAtIdShortPath,
  ColumnParam,
  CursorQueryParam,
  IdParam,
  IdShortPathParam,
  LimitQueryParam,
  PositionQueryParam,
  RequestParam,
  RowParam,
  SubmodelElementModificationRequestBody,
  SubmodelElementRequestBody,
  SubmodelElementValueModificationRequestBody,
  SubmodelIdParam,
  SubmodelModificationRequestBody,
  SubmodelRequestBody,
} from "../../aas/presentation/aas.decorators";
import {
  IAasCreateEndpoints,
  IAasDeleteEndpoints,
  IAasModifyEndpoints,
  IAasReadEndpoints,
} from "../../aas/presentation/aas.endpoints";
import {
  checkOwnerShipOfDppIdentifiable,
  EnvironmentService,
} from "../../aas/presentation/environment.service";
import { AuthService } from "../../auth/auth.service";
import { Pagination } from "../../pagination/pagination";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";

@Controller("/passports")
export class PassportController implements IAasReadEndpoints, IAasCreateEndpoints, IAasModifyEndpoints, IAasDeleteEndpoints {
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

  @ApiDeleteSubmodelById()
  async deleteSubmodel(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @RequestParam() req: express.Request,
  ): Promise<void> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    await this.environmentService.deleteSubmodelFromEnvironment(passport.getEnvironment(), submodelId, this.saveEnvironmentCallback(passport));
  }

  @ApiPatchSubmodel()
  async modifySubmodel(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelModificationRequestBody() body: SubmodelModificationDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelResponseDto> {
    const template = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.modifySubmodel(template.getEnvironment(), submodelId, body);
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

  @ApiPostColumn()
  async addColumnToSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @PositionQueryParam() position: number | undefined,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    const column = parseSubmodelElement(body);
    return await this.environmentService.addColumn(passport.getEnvironment(), submodelId, idShortPath, column, position);
  }

  @ApiPatchColumn()
  async modifyColumnOfSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @SubmodelModificationRequestBody() body: SubmodelElementModificationDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.modifyColumn(passport.getEnvironment(), submodelId, idShortPath, idShortOfColumn, body);
  }

  @ApiDeleteColumn()
  async deleteColumnFromSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementListResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.deleteColumn(passport.getEnvironment(), submodelId, idShortPath, idShortOfColumn);
  }

  @ApiPostRow()
  async addRowToSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @PositionQueryParam() position: number | undefined,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.addRow(passport.getEnvironment(), submodelId, idShortPath, position);
  }

  @ApiDeleteRow()
  async deleteRowFromSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RowParam() idShortOfRow: string,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementListResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.deleteRow(passport.getEnvironment(), submodelId, idShortPath, idShortOfRow);
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

  @ApiDeleteSubmodelElementById()
  async deleteSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<void> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    await this.environmentService.deleteSubmodelElement(passport.getEnvironment(), submodelId, idShortPath);
  }

  @ApiPatchSubmodelElement()
  async modifySubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.modifySubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiPatchSubmodelElementValue()
  async modifySubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementValueModificationRequestBody() body: ValueRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.modifyValueOfSubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath);
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
