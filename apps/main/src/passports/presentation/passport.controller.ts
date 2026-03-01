import type {
  PassportDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementRequestDto,
  SubmodelModificationDto,
  SubmodelRequestDto,
  ValueRequestDto,
} from "@open-dpp/dto";
import type express from "express";
import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  AssetKind,
  PassportDtoSchema,
  PassportPaginationDtoSchema,
  PassportRequestCreateDtoSchema,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { Environment } from "../../aas/domain/environment";
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
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { DbSessionOptions } from "../../database/query-options";
import { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { Pagination } from "../../pagination/pagination";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import {
  UniqueProductIdentifierService,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";

@Controller("/passports")
export class PassportController implements IAasReadEndpoints, IAasCreateEndpoints, IAasModifyEndpoints, IAasDeleteEndpoints {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly passportRepository: PassportRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierService,
  ) {
  }

  @Get()
  async getPassports(
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @AuthSession() session: Session,
  ): Promise<PassportPaginationDto> {
    const pagination = Pagination.create({ limit, cursor });
    const activeOrganizationId = session.activeOrganizationId;
    if (!activeOrganizationId) {
      throw new BadRequestException("activeOrganizationId is required in session");
    }
    return PassportPaginationDtoSchema.parse(
      (await this.passportRepository.findAllByOrganizationId(activeOrganizationId, pagination)).toPlain(),
    );
  }

  @Get(":passportId")
  async getPassport(
    @RequestParam() req: express.Request,
    @Param("passportId") id: string,
  ): Promise<PassportDto> {
    return PassportDtoSchema.parse((await this.passportRepository.findOneOrFail(id)).toPlain());
  }

  @Post()
  async createPassport(
    @Body(new ZodValidationPipe(PassportRequestCreateDtoSchema)) body: PassportRequestCreateDto,
    @AuthSession() session: Session,
  ): Promise<PassportDto> {
    const activeOrganizationId = session.activeOrganizationId;
    if (!activeOrganizationId) {
      throw new BadRequestException("activeOrganizationId is required in session");
    }
    let environment: Environment;
    if (body && body.templateId) {
      const template = await this.templateRepository.findOneOrFail(body.templateId);
      environment = await this.environmentService.copyEnvironment(template.environment);
    }
    else {
      environment = await this.environmentService.createEnvironmentWithEmptyAas(AssetKind.Instance);
    }
    const passport = Passport.create({
      organizationId: activeOrganizationId,
      templateId: body?.templateId ?? undefined,
      environment,
    });

    const upid = passport.createUniqueProductIdentifier();
    await this.uniqueProductIdentifierService.save(upid);

    return PassportDtoSchema.parse((await this.passportRepository.save(passport)).toPlain());
  }

  @ApiGetShells()
  async getShells(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @AuthSession() session: Session,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(passport.getEnvironment(), pagination);
  }

  @ApiGetSubmodels()
  async getSubmodels(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @AuthSession() session: Session,
  ): Promise<SubmodelPaginationResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(passport.getEnvironment(), pagination);
  }

  @ApiPostSubmodel()
  async createSubmodel(
    @IdParam() id: string,
    @SubmodelRequestBody() body: SubmodelRequestDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.addSubmodelToEnvironment(passport.getEnvironment(), body, this.saveEnvironmentCallback(passport));
  }

  @ApiDeleteSubmodelById()
  async deleteSubmodel(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @AuthSession() session: Session,
  ): Promise<void> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    await this.environmentService.deleteSubmodelFromEnvironment(passport.getEnvironment(), submodelId, this.saveEnvironmentCallback(passport));
  }

  @ApiPatchSubmodel()
  async modifySubmodel(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelModificationRequestBody() body: SubmodelModificationDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.modifySubmodel(passport.getEnvironment(), submodelId, body);
  }

  @ApiGetSubmodelById()
  async getSubmodelById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @AuthSession() session: Session,
  ): Promise<SubmodelResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.getSubmodelById(passport.getEnvironment(), submodelId);
  }

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @AuthSession() session: Session,
  ): Promise<ValueResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.getSubmodelValue(passport.getEnvironment(), submodelId);
  }

  @ApiPostColumn()
  async addColumnToSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @PositionQueryParam() position: number | undefined,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementListResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    const column = parseSubmodelElement(body);
    return await this.environmentService.addColumn(passport.getEnvironment(), submodelId, idShortPath, column, position);
  }

  @ApiPatchColumn()
  async modifyColumnOfSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementListResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.modifyColumn(passport.getEnvironment(), submodelId, idShortPath, idShortOfColumn, body);
  }

  @ApiDeleteColumn()
  async deleteColumnFromSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementListResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.deleteColumn(passport.getEnvironment(), submodelId, idShortPath, idShortOfColumn);
  }

  @ApiPostRow()
  async addRowToSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @PositionQueryParam() position: number | undefined,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementListResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.addRow(passport.getEnvironment(), submodelId, idShortPath, position);
  }

  @ApiDeleteRow()
  async deleteRowFromSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RowParam() idShortOfRow: string,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementListResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.deleteRow(passport.getEnvironment(), submodelId, idShortPath, idShortOfRow);
  }

  @ApiPostSubmodelElement()
  async createSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.addSubmodelElement(passport.getEnvironment(), submodelId, body);
  }

  @ApiDeleteSubmodelElementById()
  async deleteSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @AuthSession() session: Session,
  ): Promise<void> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    await this.environmentService.deleteSubmodelElement(passport.getEnvironment(), submodelId, idShortPath);
  }

  @ApiPatchSubmodelElement()
  async modifySubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.modifySubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiPatchSubmodelElementValue()
  async modifySubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementValueModificationRequestBody() body: ValueRequestDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.modifyValueOfSubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElements()
  async getSubmodelElements(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(passport.getEnvironment(), submodelId, pagination);
  }

  @ApiGetSubmodelElementById()
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.getSubmodelElementById(passport.getEnvironment(), submodelId, idShortPath);
  }

  @ApiPostSubmodelElementAtIdShortPath()
  async createSubmodelElementAtIdShortPath(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.addSubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @AuthSession() session: Session,
  ): Promise<ValueResponseDto> {
    const passport = await this.loadPassportAndCheckOwnership(id, session);
    return await this.environmentService.getSubmodelElementValue(passport.getEnvironment(), submodelId, idShortPath);
  }

  private async loadPassportAndCheckOwnership(id: string, session: Session): Promise<Passport> {
    const passport = await this.passportRepository.findOneOrFail(id);
    return this.environmentService.checkOwnerShipOfDppIdentifiable(passport, session);
  }

  private saveEnvironmentCallback(passport: Passport) {
    return async (options: DbSessionOptions) => {
      await this.passportRepository.save(passport, options);
    };
  }
}
