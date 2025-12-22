import type {
  AssetAdministrationShellPaginationResponseDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
  TemplateDto,
  TemplatePaginationDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import type express from "express";
import { Controller, Get, Post, Req, UnauthorizedException } from "@nestjs/common";
import { AssetKind, TemplateDtoSchema, TemplatePaginationDtoSchema } from "@open-dpp/dto";
import { fromNodeHeaders } from "better-auth/node";
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
import { EnvironmentService, loadEnvironmentAndCheckOwnership } from "../../aas/presentation/environment.service";
import { AuthService } from "../../auth/auth.service";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";

@Controller("/templates")
export class TemplateController implements IAasReadEndpoints, IAasCreateEndpoints {
  constructor(private readonly environmentService: EnvironmentService, private readonly authService: AuthService, private readonly templateRepository: TemplateRepository) {
  }

  @ApiGetShells()
  async getShells(@IdParam() id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @Req() req: express.Request): Promise<AssetAdministrationShellPaginationResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(environment, pagination);
  }

  @ApiGetSubmodels()
  async getSubmodels(@IdParam() id: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @Req() req: express.Request): Promise<SubmodelPaginationResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(environment, pagination);
  }

  @ApiPostSubmodel()
  async createSubmodel(
    @IdParam() id: string,
    @SubmodelRequestBody() body: SubmodelRequestDto,
    @Req() req: express.Request,
  ): Promise<SubmodelResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    return await this.environmentService.addSubmodelToEnvironment(environment, body);
  }

  @ApiGetSubmodelById()
  async getSubmodelById(@IdParam() id: string, @SubmodelIdParam() submodelId: string, @RequestParam() req: express.Request): Promise<SubmodelResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    return await this.environmentService.getSubmodelById(environment, submodelId);
  }

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @RequestParam() req: express.Request,
  ): Promise<ValueResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    return await this.environmentService.getSubmodelValue(environment, submodelId);
  }

  @ApiGetSubmodelElements()
  async getSubmodelElements(@IdParam() id: string, @SubmodelIdParam() submodelId: string, @LimitQueryParam() limit: number | undefined, @CursorQueryParam() cursor: string | undefined, @RequestParam() req: express.Request): Promise<SubmodelElementPaginationResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(environment, submodelId, pagination);
  }

  @ApiPostSubmodelElement()
  async createSubmodelElement(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    return await this.environmentService.addSubmodelElement(environment, submodelId, body);
  }

  @ApiGetSubmodelElementById()
  async getSubmodelElementById(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    return await this.environmentService.getSubmodelElementById(environment, submodelId, idShortPath);
  }

  @ApiPostSubmodelElementAtIdShortPath()
  async createSubmodelElementAtIdShortPath(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @RequestParam() req: express.Request,
  ): Promise<SubmodelElementResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    return await this.environmentService.addSubmodelElement(environment, submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RequestParam() req: express.Request,
  ): Promise<ValueResponseDto> {
    const environment = await loadEnvironmentAndCheckOwnership(this.authService, this.templateRepository, id, req);
    return await this.environmentService.getSubmodelElementValue(environment, submodelId, idShortPath);
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
}
