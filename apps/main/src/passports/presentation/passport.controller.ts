import type {
  AssetAdministrationShellModificationDto,
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
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";

import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellResponseDto,
  PassportDtoSchema,
  PassportPaginationDtoSchema,
  PassportRequestCreateDtoSchema,
  Populates,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { match, P } from "ts-pattern";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { IdShortPath, parseSubmodelElement } from "../../aas/domain/submodel-base/submodel-base";
import { AasSerializationService } from "../../aas/infrastructure/serialization/aas-serialization.service";
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
  PopulateQueryParam,
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
  IAasReadEndpointsWithOrganizationId,
} from "../../aas/presentation/aas.endpoints";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { DbSessionOptions } from "../../database/query-options";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import {
  UniqueProductIdentifierService,
} from "../../unique-product-identifier/infrastructure/unique-product-identifier.service";
import { PassportService } from "../application/services/passport.service";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";

@Controller("/passports")
export class PassportController implements IAasReadEndpointsWithOrganizationId, IAasCreateEndpoints, IAasModifyEndpoints, IAasDeleteEndpoints {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly passportRepository: PassportRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierService,
    private readonly passportService: PassportService,
    private readonly aasSerializationService: AasSerializationService,
  ) {
  }

  @Get()
  async getPassports(
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @PopulateQueryParam() populate: string[],
    @OrganizationId() organizationId: string,
  ): Promise<PassportPaginationDto> {
    const pagination = Pagination.create({ limit, cursor });
    let pagingResult: PagingResult<any> = await this.passportRepository.findAllByOrganizationId(organizationId, pagination);
    if (populate.includes(Populates.assetAdministrationShells)) {
      pagingResult = await this.environmentService.populateEnvironmentForPagingResult(
        pagingResult,
        { assetAdministrationShells: true, submodels: false, ignoreMissing: false },
      );
    }

    return PassportPaginationDtoSchema.parse(pagingResult.toPlain());
  }

  @Get(":passportId")
  async getPassport(
    @RequestParam() req: express.Request,
    @Param("passportId") id: string,
  ): Promise<PassportDto> {
    return PassportDtoSchema.parse((await this.passportRepository.findOneOrFail(id)).toPlain());
  }

  @Get(":id/unique-product-identifier")
  async getUniqueProductIdentifierOfPassport(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<{ uuid: string }> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const upi = await this.uniqueProductIdentifierService.findOneByReferencedId(id);
    if (!upi) {
      throw new NotFoundException(
        `No UniqueProductIdentifier found for passport ${id}`,
      );
    }
    return { uuid: upi.uuid };
  }

  @Post()
  async createPassport(
    @OrganizationId() organizationId: string,
    @Body(new ZodValidationPipe(PassportRequestCreateDtoSchema)) body: PassportRequestCreateDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PassportDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const { environment, templateId } = await match(body).returnType<Promise<{
      environment: Environment;
      templateId?: string;
    }>>().with(
      { templateId: P.string },
      async ({ templateId }) => {
        const template = await this.loadTemplateAndCheckOwnership(templateId, subject, organizationId);
        return { environment: await this.environmentService.copyEnvironment(template.environment), templateId };
      },
    ).with({
      environment: { assetAdministrationShells: P.array() },
    }, async ({ environment: localEnvironment }) => {
      return { environment: await this.environmentService.createEnvironment(
        localEnvironment,
        false,
      ) };
    }).otherwise(() => {
      throw new BadRequestException("Either templateId or environment.assetAdministrationShells must be provided");
    });

    const passport = Passport.create({
      organizationId,
      templateId,
      environment,
    });

    const upid = passport.createUniqueProductIdentifier();
    await this.uniqueProductIdentifierService.save(upid);

    return PassportDtoSchema.parse((await this.passportRepository.save(passport)).toPlain());
  }

  @ApiGetShells()
  async getShells(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<AssetAdministrationShellPaginationResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(passport.getEnvironment(), pagination, subject);
  }

  @ApiPatchShell()
  async modifyShell(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @AssetAdministrationShellIdParam() aasId: string,
    @AssetAdministrationShellModificationRequestBody() body: AssetAdministrationShellModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<AssetAdministrationShellResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.modifyAasShell(passport.getEnvironment(), aasId, body, subject);
  }

  @ApiGetSubmodels()
  async getSubmodels(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelPaginationResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(passport.getEnvironment(), pagination, subject);
  }

  @ApiPostSubmodel()
  async createSubmodel(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelRequestBody() body: SubmodelRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.addSubmodelToEnvironment(passport.getEnvironment(), body, this.saveEnvironmentCallback(passport));
  }

  @ApiDeleteSubmodelById()
  async deleteSubmodel(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    await this.environmentService.deleteSubmodelFromEnvironment(passport.getEnvironment(), submodelId, this.saveEnvironmentCallback(passport));
  }

  @ApiPatchSubmodel()
  async modifySubmodel(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelModificationRequestBody() body: SubmodelModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.modifySubmodel(passport.getEnvironment(), submodelId, body, subject);
  }

  @ApiGetSubmodelById()
  async getSubmodelById(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.getSubmodelById(passport.getEnvironment(), submodelId, subject);
  }

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<ValueResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.getSubmodelValue(passport.getEnvironment(), submodelId, subject);
  }

  @ApiPostColumn()
  async addColumnToSubmodelElementList(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @PositionQueryParam() position: number | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const column = parseSubmodelElement(body);
    return await this.environmentService.addColumn(passport.getEnvironment(), submodelId, idShortPath, column, position);
  }

  @ApiPatchColumn()
  async modifyColumnOfSubmodelElementList(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.modifyColumn(passport.getEnvironment(), submodelId, idShortPath, idShortOfColumn, body, subject);
  }

  @ApiDeleteColumn()
  async deleteColumnFromSubmodelElementList(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.deleteColumn(passport.getEnvironment(), submodelId, idShortPath, idShortOfColumn);
  }

  @ApiPostRow()
  async addRowToSubmodelElementList(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @PositionQueryParam() position: number | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.addRow(passport.getEnvironment(), submodelId, idShortPath, position);
  }

  @ApiDeleteRow()
  async deleteRowFromSubmodelElementList(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RowParam() idShortOfRow: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.deleteRow(passport.getEnvironment(), submodelId, idShortPath, idShortOfRow);
  }

  @ApiPostSubmodelElement()
  async createSubmodelElement(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.addSubmodelElement(passport.getEnvironment(), submodelId, body);
  }

  @ApiDeleteSubmodelElementById()
  async deleteSubmodelElement(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    await this.environmentService.deleteSubmodelElement(passport.getEnvironment(), submodelId, idShortPath);
  }

  @ApiPatchSubmodelElement()
  async modifySubmodelElement(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.modifySubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath, subject);
  }

  @ApiPatchSubmodelElementValue()
  async modifySubmodelElementValue(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementValueModificationRequestBody() body: ValueRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.modifyValueOfSubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath, subject);
  }

  @ApiGetSubmodelElements()
  async getSubmodelElements(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(passport.getEnvironment(), submodelId, pagination, subject);
  }

  @ApiGetSubmodelElementById()
  async getSubmodelElementById(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.getSubmodelElementById(passport.getEnvironment(), submodelId, idShortPath, subject);
  }

  @ApiPostSubmodelElementAtIdShortPath()
  async createSubmodelElementAtIdShortPath(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.addSubmodelElement(passport.getEnvironment(), submodelId, body, idShortPath);
  }

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<ValueResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.environmentService.getSubmodelElementValue(passport.getEnvironment(), submodelId, idShortPath, subject);
  }

  @Get("/:id/export")
  async exportPassport(
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @OrganizationId() organizationId: string,
  ): Promise<any> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport = await this.loadPassportAndCheckOwnership(id, subject, organizationId);
    return await this.aasSerializationService.exportPassport(passport);
  }

  @Post("/import")
  async importPassport(
    @Body() body: any,
    @OrganizationId() organizationId: string,
  ): Promise<PassportDto> {
    const passport = await this.aasSerializationService.importPassport(
      body,
      organizationId,
      async (p, options) => {
        await this.passportRepository.save(p, options);
        const upid = p.createUniqueProductIdentifier();
        await this.uniqueProductIdentifierService.save(upid, options);
      },
    );
    return PassportDtoSchema.parse(passport.toPlain());
  }

  private async loadPassportAndCheckOwnership(id: string, subject: SubjectAttributes, organizationId: string): Promise<Passport> {
    const passport = await this.passportRepository.findOneOrFail(id);
    if (passport.getOrganizationId() !== organizationId || subject.memberRole === undefined) {
      throw new ForbiddenException();
    }
    return passport;
  }

  private async loadTemplateAndCheckOwnership(id: string, subject: SubjectAttributes, organizationId: string): Promise<Template> {
    const template = await this.templateRepository.findOneOrFail(id);
    if (template.getOrganizationId() !== organizationId || subject.memberRole === undefined) {
      throw new ForbiddenException();
    }
    return template;
  }

  private saveEnvironmentCallback(passport: Passport) {
    return async (options: DbSessionOptions) => {
      await this.passportRepository.save(passport, options);
    };
  }
}
