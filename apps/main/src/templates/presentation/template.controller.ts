import type {
  SubmodelElementRequestDto,
  SubmodelRequestDto,
} from "@open-dpp/dto";
import { BadRequestException, Controller, Get, Logger, Post } from "@nestjs/common";
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
  SubmodelElementRequestBody,
  SubmodelIdParam,
  SubmodelRequestBody,
} from "../../aas/presentation/aas.decorators";
import { IAasCreateEndpoints, IAasReadEndpoints } from "../../aas/presentation/aas.endpoints";
import {
  EnvironmentService,
} from "../../aas/presentation/environment.service";
import { Session } from "../../identity/auth/domain/session";
import { AuthSession } from "../../identity/auth/presentation/decorators/auth-session.decorator";
import { Pagination } from "../../pagination/pagination";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";

@Controller("/templates")
export class TemplateController implements IAasReadEndpoints, IAasCreateEndpoints {
  private readonly logger = new Logger(TemplateController.name);

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
    @AuthSession() session: Session,
  ): Promise<TemplateDto> {
    const environment = await this.environmentService.createEnvironmentWithEmptyAas(AssetKind.Type);
    const activeOrganizationId = session.activeOrganizationId;
    if (!activeOrganizationId) {
      throw new BadRequestException();
    }
    const template = Template.create({ organizationId: activeOrganizationId, environment });
    const template = Template.create({ organizationId: await this.authService.getActiveOrganizationId(req), environment });
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
      (await this.templateRepository.findAllByOrganizationId(await this.authService.getActiveOrganizationId(req), pagination)).toPlain(),
    );
  }

  private saveEnvironmentCallback(template: Template) {
    return async () => {
      await this.templateRepository.save(template);
    };
  }

  private async loadTemplateAndCheckOwnership(id: string, session: Session): Promise<Template> {
    const template = await this.templateRepository.findOneOrFail(id);
    return this.environmentService.checkOwnerShipOfDppIdentifiable(template, session);
  }
}
