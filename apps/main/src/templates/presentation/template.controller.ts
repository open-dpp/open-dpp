import type {
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementRequestDto,
  SubmodelModificationDto,
  SubmodelRequestDto,
  ValueRequestDto,
} from "@open-dpp/dto";
import type express from "express";
import { Controller, Get, Logger, Post, Req, UnauthorizedException } from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  AssetKind,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  TemplateDto,
  TemplateDtoSchema,
  TemplatePaginationDto,
  TemplatePaginationDtoSchema,
  ValueResponseDto,
} from "@open-dpp/dto";
import { fromNodeHeaders } from "better-auth/node";
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
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";

@Controller("/templates")
export class TemplateController implements IAasReadEndpoints, IAasCreateEndpoints, IAasModifyEndpoints, IAasDeleteEndpoints {
  private readonly logger = new Logger(TemplateController.name);

  constructor(private readonly environmentService: EnvironmentService, private readonly authService: AuthService, private readonly templateRepository: TemplateRepository) {
  }

  @ApiGetShells()
  async getShells(@IdParam() id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @Req() req: express.Request): Promise<AssetAdministrationShellPaginationResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(template.getEnvironment(), pagination);
  }

  @ApiGetSubmodels()
  async getSubmodels(@IdParam() id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @Req() req: express.Request): Promise<SubmodelPaginationResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(template.getEnvironment(), pagination);
  }

  @ApiPostSubmodel()
  async createSubmodel(
    @IdParam() id: string,
    @SubmodelRequestBody() body: SubmodelRequestDto,
    @Req() req: express.Request,
  ): Promise<SubmodelResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
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
    @RequestParam() req: express.Request,
  ): Promise<void> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    await this.environmentService.deleteSubmodelFromEnvironment(template.getEnvironment(), submodelId, this.saveEnvironmentCallback(template));
  }

  @ApiPatchSubmodel()
  async modifySubmodel(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelModificationRequestBody() body: SubmodelModificationDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.modifySubmodel(template.getEnvironment(), submodelId, body);
  }

  @ApiGetSubmodelById()
  async getSubmodelById(@IdParam() id: string, @SubmodelIdParam() submodelId: string, @RequestParam() req: express.Request): Promise<SubmodelResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.getSubmodelById(template.getEnvironment(), submodelId);
  }

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @RequestParam() req: express.Request,
  ): Promise<ValueResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.getSubmodelValue(template.getEnvironment(), submodelId);
  }

  @ApiGetSubmodelElements()
  async getSubmodelElements(@IdParam() id: string, @SubmodelIdParam() submodelId: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @RequestParam() req: express.Request): Promise<SubmodelElementPaginationResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(template.getEnvironment(), submodelId, pagination);
  }

  @ApiPostSubmodelElement()
  async createSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.addSubmodelElement(template.getEnvironment(), submodelId, body);
  }

  @ApiDeleteSubmodelElementById()
  async deleteSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<void> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    await this.environmentService.deleteSubmodelElement(template.getEnvironment(), submodelId, idShortPath);
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
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    const column = parseSubmodelElement(body);
    return await this.environmentService.addColumn(template.getEnvironment(), submodelId, idShortPath, column, position);
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
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.modifyColumn(template.getEnvironment(), submodelId, idShortPath, idShortOfColumn, body);
  }

  @ApiDeleteColumn()
  async deleteColumnFromSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementListResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.deleteColumn(template.getEnvironment(), submodelId, idShortPath, idShortOfColumn);
  }

  @ApiPostRow()
  async addRowToSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @PositionQueryParam() position: number | undefined,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.addRow(template.getEnvironment(), submodelId, idShortPath, position);
  }

  @ApiDeleteRow()
  async deleteRowFromSubmodelElementList(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RowParam() idShortOfRow: string,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementListResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.deleteRow(template.getEnvironment(), submodelId, idShortPath, idShortOfRow);
  }

  @ApiPatchSubmodelElement()
  async modifySubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.modifySubmodelElement(template.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiPatchSubmodelElementValue()
  async modifySubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementValueModificationRequestBody() body: ValueRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.modifyValueOfSubmodelElement(template.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementById()
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.getSubmodelElementById(template.getEnvironment(), submodelId, idShortPath);
  }

  @ApiPostSubmodelElementAtIdShortPath()
  async createSubmodelElementAtIdShortPath(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.addSubmodelElement(template.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<ValueResponseDto> {
    const template = await this.loadTemplateAndCheckOwnership(this.authService, id, req);
    return await this.environmentService.getSubmodelElementValue(template.getEnvironment(), submodelId, idShortPath);
  }

  @Post()
  async createTemplate(
    @RequestParam() req: express.Request,
  ): Promise<TemplateDto> {
    const environment = await this.environmentService.createEnvironmentWithEmptyAas(AssetKind.Type);
    const template = Template.create({ organizationId: await this.getActiveOrganizationId(req), environment });
    return TemplateDtoSchema.parse((await this.templateRepository.save(template)).toPlain());
  }

  @Get()
  async getTemplates(
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @RequestParam() req: express.Request,
  ): Promise<TemplatePaginationDto> {
    const pagination = Pagination.create({ limit, cursor });
    return TemplatePaginationDtoSchema.parse(
      (await this.templateRepository.findAllByOrganizationId(await this.getActiveOrganizationId(req), pagination)).toPlain(),
    );
  }

  private async getActiveOrganizationId(req: express.Request) {
    const session = await this.authService.getSession(fromNodeHeaders(req.headers || []));
    if (!session?.user) {
      throw new UnauthorizedException("User is not logged in");
    }
    const activeOrganization = await this.authService.getActiveOrganization(session.user.id);
    if (!activeOrganization) {
      throw new UnauthorizedException("User is not part of any organization");
    }
    return activeOrganization._id.toString();
  }

  private saveEnvironmentCallback(template: Template) {
    return async () => {
      await this.templateRepository.save(template);
    };
  }

  private async loadTemplateAndCheckOwnership(authService: AuthService, id: string, req: express.Request): Promise<Template> {
    const template = await this.templateRepository.findOneOrFail(id);
    return checkOwnerShipOfDppIdentifiable(template, authService, req);
  }
}
