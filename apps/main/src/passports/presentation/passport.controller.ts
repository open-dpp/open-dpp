import type { PassportDto, PassportPaginationDto, PassportRequestCreateDto, SubmodelElementRequestDto, SubmodelRequestDto } from "@open-dpp/dto";
import type express from "express";
import { Body, Controller, Get, Post } from "@nestjs/common";
import { AssetAdministrationShellPaginationResponseDto, AssetKind, PassportDtoSchema, PassportPaginationDtoSchema, PassportRequestCreateDtoSchema, SubmodelElementPaginationResponseDto, SubmodelElementResponseDto, SubmodelPaginationResponseDto, SubmodelResponseDto, ValueResponseDto } from "@open-dpp/dto";

import { ZodValidationPipe } from "@open-dpp/exception";
import { Environment } from "../../aas/domain/environment";
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
import { AuthService } from "../../auth/auth.service";
import { Pagination } from "../../pagination/pagination";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { UniqueProductIdentifierService } from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";

@Controller("/passports")
export class PassportController implements IAasReadEndpoints, IAasCreateEndpoints {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly authService: AuthService,
    private readonly passportRepository: PassportRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierService,
  ) {
  }

  @Get()
  async getPassports(
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @RequestParam() req: express.Request,
  ): Promise<PassportPaginationDto> {
    const pagination = Pagination.create({ limit, cursor });
    const pagingResult = await this.passportRepository.findAllByOrganizationId(
      await this.authService.getActiveOrganizationId(req),
      pagination,
    );
    const plain = pagingResult.toPlain();
    const enrichedResult = await Promise.all(
      plain.result.map(async (p: Record<string, unknown>) => {
        const upis = await this.uniqueProductIdentifierService.findAllByReferencedId(
          p.id as string,
        );
        return {
          ...p,
          uniqueProductIdentifierUuid: upis[0]?.uuid,
        };
      }),
    );
    return PassportPaginationDtoSchema.parse({
      ...plain,
      result: enrichedResult,
    });
  }

  @Post()
  async createPassport(
    @Body(new ZodValidationPipe(PassportRequestCreateDtoSchema)) body: PassportRequestCreateDto,
    @RequestParam() req: express.Request,
  ): Promise<PassportDto> {
    let environment: Environment;
    if (body && body.templateId) {
      const template = await this.templateRepository.findOneOrFail(body.templateId);
      environment = await this.environmentService.copyEnvironment(template.environment);
    }
    else {
      environment = await this.environmentService.createEnvironmentWithEmptyAas(AssetKind.Instance);
    }
    const passport = Passport.create({
      organizationId: await this.authService.getActiveOrganizationId(req),
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
