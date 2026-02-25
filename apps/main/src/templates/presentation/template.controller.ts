import type {
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellResponseDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementRequestDto,
  SubmodelModificationDto,
  SubmodelRequestDto,
  TemplateCreateDto,
  ValueRequestDto,
} from "@open-dpp/dto";
import { BadRequestException, Body, Controller, Get, Post } from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  AssetKind,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  TemplateCreateDtoSchema,
  TemplateDto,
  TemplateDtoSchema,
  TemplatePaginationDto,
  TemplatePaginationDtoSchema,
  ValueResponseDto,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";

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
  ApiPatchShell,
  ApiPatchSubmodel,
  ApiPatchSubmodelElement,
  ApiPatchSubmodelElementValue,
  ApiPostColumn,
  ApiPostRow,
  ApiPostSubmodel,
  ApiPostSubmodelElement,
  ApiPostSubmodelElementAtIdShortPath,
  AssetAdministrationShellIdParam,
  AssetAdministrationShellModificationRequestBody,
  ColumnParam,
  CursorQueryParam,
  IdParam,
  IdShortPathParam,
  LimitQueryParam,
  PositionQueryParam,
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
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";

@Controller("/templates")
export class TemplateController implements IAasReadEndpoints, IAasCreateEndpoints, IAasModifyEndpoints, IAasDeleteEndpoints {
  constructor(private readonly environmentService: EnvironmentService, private readonly templateRepository: TemplateRepository) {
  }

  @ApiGetShells()
  async getShells(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @AuthSession() session: Session,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(template.getEnvironment(), pagination);
  }

  @ApiPatchShell()
  async modifyShell(
    @IdParam() id: string,
    @AssetAdministrationShellIdParam() aasId: string,
    @AssetAdministrationShellModificationRequestBody() body: AssetAdministrationShellModificationDto,
    @AuthSession() session: Session,
  ): Promise<AssetAdministrationShellResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.modifyAasShell(template.getEnvironment(), aasId, body);
  }

  @ApiGetSubmodels()
  async getSubmodels(
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @AuthSession() session: Session,
  ): Promise<SubmodelPaginationResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(template.getEnvironment(), pagination);
  }

  @ApiPostSubmodel()
  async createSubmodel(
    @IdParam() id: string,
    @SubmodelRequestBody() body: SubmodelRequestDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.addSubmodelToEnvironment(
      template.getEnvironment(),
      body,
      this.saveEnvironmentCallback(template),
    );
  }

  @ApiDeleteSubmodelById()
  async deleteSubmodel(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @AuthSession() session: Session,
  ): Promise<void> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    await this.environmentService.deleteSubmodelFromEnvironment(template.getEnvironment(), submodelId, this.saveEnvironmentCallback(template));
  }

  @ApiPatchSubmodel()
  async modifySubmodel(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelModificationRequestBody() body: SubmodelModificationDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.modifySubmodel(template.getEnvironment(), submodelId, body);
  }

  @ApiGetSubmodelById()
  async getSubmodelById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @AuthSession() session: Session,
  ): Promise<SubmodelResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.getSubmodelById(template.getEnvironment(), submodelId);
  }

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @AuthSession() session: Session,
  ): Promise<ValueResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.getSubmodelValue(template.getEnvironment(), submodelId);
  }

  @ApiGetSubmodelElements()
  async getSubmodelElements(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(template.getEnvironment(), submodelId, pagination);
  }

  @ApiPostSubmodelElement()
  async createSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.addSubmodelElement(template.getEnvironment(), submodelId, body);
  }

  @ApiDeleteSubmodelElementById()
  async deleteSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @AuthSession() session: Session,
  ): Promise<void> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    await this.environmentService.deleteSubmodelElement(template.getEnvironment(), submodelId, idShortPath);
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
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    const column = parseSubmodelElement(body);
    return await this.environmentService.addColumn(template.getEnvironment(), submodelId, idShortPath, column, position);
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
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.modifyColumn(template.getEnvironment(), submodelId, idShortPath, idShortOfColumn, body);
  }

  @ApiDeleteColumn()
  async deleteColumnFromSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementListResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.deleteColumn(template.getEnvironment(), submodelId, idShortPath, idShortOfColumn);
  }

  @ApiPostRow()
  async addRowToSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @PositionQueryParam() position: number | undefined,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementListResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.addRow(template.getEnvironment(), submodelId, idShortPath, position);
  }

  @ApiDeleteRow()
  async deleteRowFromSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RowParam() idShortOfRow: string,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementListResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.deleteRow(template.getEnvironment(), submodelId, idShortPath, idShortOfRow);
  }

  @ApiPatchSubmodelElement()
  async modifySubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.modifySubmodelElement(template.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiPatchSubmodelElementValue()
  async modifySubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementValueModificationRequestBody() body: ValueRequestDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.modifyValueOfSubmodelElement(template.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementById()
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.getSubmodelElementById(template.getEnvironment(), submodelId, idShortPath);
  }

  @ApiPostSubmodelElementAtIdShortPath()
  async createSubmodelElementAtIdShortPath(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @AuthSession() session: Session,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.addSubmodelElement(template.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @AuthSession() session: Session,
  ): Promise<ValueResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(id, session);
    return await this.environmentService.getSubmodelElementValue(template.getEnvironment(), submodelId, idShortPath);
  }

  @Post()
  async createTemplate(
    @Body(new ZodValidationPipe(TemplateCreateDtoSchema)) body: TemplateCreateDto,
    @AuthSession() session: Session,
  ): Promise<TemplateDto> {
    const environment = await this.environmentService.createEnvironment(
      { ...body, assetInformation: body.assetInformation ?? { assetKind: AssetKind.Type } },
    );
    const activeOrganizationId = session.activeOrganizationId;
    if (!activeOrganizationId) {
      throw new BadRequestException();
    }
    const template = Template.create({ organizationId: activeOrganizationId, environment });
    return TemplateDtoSchema.parse((await this.templateRepository.save(template)).toPlain());
  }

  @Get()
  async getTemplates(
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @AuthSession() session: Session,
  ): Promise<TemplatePaginationDto> {
    const pagination = Pagination.create({ limit, cursor });
    const activeOrganizationId = session.activeOrganizationId;
    if (!activeOrganizationId) {
      throw new BadRequestException();
    }
    return TemplatePaginationDtoSchema.parse(
      (await this.templateRepository.findAllByOrganizationId(activeOrganizationId, pagination)).toPlain(),
    );
  }

  private saveEnvironmentCallback(template: Template) {
    return async (options: DbSessionOptions) => {
      await this.templateRepository.save(template, options);
    };
  }

  private async loadTemplateAndCheckOwnership(id: string, session: Session): Promise<Template> {
    const template = await this.templateRepository.findOneOrFail(id);
    return this.environmentService.checkOwnerShipOfDppIdentifiable(template, session);
  }
}
