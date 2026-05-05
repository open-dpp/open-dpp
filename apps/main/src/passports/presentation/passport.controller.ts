import type {
  AssetAdministrationShellModificationDto,
  DeletePolicyDto,
  DigitalProductDocumentStatusModificationDto,
  PassportDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementRequestDto,
  SubmodelModificationDto,
  SubmodelRequestDto,
  ValueRequestDto,
  DigitalProductDocumentStatusDtoType,
} from "@open-dpp/dto";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";

import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import {
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellResponseDto,
  PassportDtoSchema,
  PassportPaginationDtoSchema,
  PassportRequestCreateDtoSchema,
  DigitalProductDocumentStatusModificationDtoSchema,
  Populates,
  SubmodelElementPaginationResponseDto,
  SubmodelElementResponseDto,
  SubmodelPaginationResponseDto,
  SubmodelResponseDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { match, P } from "ts-pattern";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { Environment } from "../../aas/domain/environment";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { AasSerializationService } from "../../aas/infrastructure/serialization/aas-serialization.service";
import {
  ApiDeleteColumn,
  ApiDeletePolicy,
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
  DeletePolicyRequestBody,
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
  IAasReadEndpointsWithOrganizationId,
} from "../../aas/presentation/aas.endpoints";
import { EnvironmentService } from "../../aas/presentation/environment.service";
import { MemberRoleDecorator } from "../../identity/auth/presentation/decorators/member-role.decorator";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import { PermalinkApplicationService } from "../../permalink/application/services/permalink.application.service";
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { PresentationConfigurationService } from "../../presentation-configurations/application/services/presentation-configuration.service";
import { Template } from "../../templates/domain/template";
import { TemplateRepository } from "../../templates/infrastructure/template.repository";
import { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { PassportService } from "../application/services/passport.service";
import { Passport } from "../domain/passport";
import { PassportRepository } from "../infrastructure/passport.repository";
import {
  PopulateQueryParam,
  StatusQueryParam,
} from "../../digital-product-document/presentation/digital-product-document-decorators";

@Controller("/passports")
export class PassportController
  implements
    IAasReadEndpointsWithOrganizationId,
    IAasCreateEndpoints,
    IAasModifyEndpoints,
    IAasDeleteEndpoints
{
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly passportRepository: PassportRepository,
    private readonly templateRepository: TemplateRepository,
    private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    private readonly passportService: PassportService,
    private readonly aasSerializationService: AasSerializationService,
    @Inject(forwardRef(() => PermalinkApplicationService))
    private readonly permalinkApplicationService: PermalinkApplicationService,
    private readonly presentationConfigurationService: PresentationConfigurationService,
  ) {}

  @Get()
  async getPassports(
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @PopulateQueryParam() populate: string[],
    @StatusQueryParam() status: DigitalProductDocumentStatusDtoType[] | undefined,
    @OrganizationId() organizationId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PassportPaginationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const pagination = Pagination.create({ limit, cursor });
    let pagingResult: PagingResult<any> = await this.passportRepository.findAllByOrganizationId(
      organizationId,
      { pagination, ...(status ? { filter: { status } } : {}) },
    );
    if (populate.includes(Populates.assetAdministrationShells) && pagingResult.items.length > 0) {
      pagingResult = await this.environmentService.populateEnvironmentForPagingResult(
        pagingResult,
        { assetAdministrationShells: true, submodels: false, ignoreMissing: false },
        subject,
      );
    }

    return PassportPaginationDtoSchema.parse(pagingResult.toPlain());
  }

  @Get(":id")
  async getPassport(
    @OrganizationId() organizationId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Param("id") id: string,
  ): Promise<PassportDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return PassportDtoSchema.parse(passport.toPlain());
  }

  @Get(":id/unique-product-identifier")
  async getUniqueProductIdentifierOfPassport(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<{ uuid: string }> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const upi = await this.uniqueProductIdentifierRepository.findOneByReferencedId(id);
    if (!upi) {
      throw new NotFoundException(`No UniqueProductIdentifier found for passport ${id}`);
    }
    return { uuid: upi.uuid };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePassport(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.deletePassport(id, organizationId, subject);
  }

  // REST action pattern like https://blog.ivankahl.com/practical-guide-to-modeling-business-processes-in-rest-apis/.
  @Put(":id/status")
  async modifyPassportStatus(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(DigitalProductDocumentStatusModificationDtoSchema))
    body: DigitalProductDocumentStatusModificationDto,
  ): Promise<PassportDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return this.passportService.modifyPassportStatus(id, organizationId, subject, body);
  }

  @Post()
  async createPassport(
    @OrganizationId() organizationId: string,
    @Body(new ZodValidationPipe(PassportRequestCreateDtoSchema)) body: PassportRequestCreateDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PassportDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const { environment, templateId } = await match(body)
      .returnType<
        Promise<{
          environment: Environment;
          templateId?: string;
        }>
      >()
      .with({ templateId: P.string }, async ({ templateId }) => {
        const template = await this.loadTemplateAndCheckOwnership(
          templateId,
          subject,
          organizationId,
        );
        if (template.isArchived()) {
          throw new BadRequestException(
            `Template ${templateId} is archived and cannot be used to create a passport`,
          );
        }
        return {
          environment: await this.environmentService.copyEnvironment(template.environment),
          templateId,
        };
      })
      .with(
        {
          environment: { assetAdministrationShells: P.array() },
        },
        async ({ environment: localEnvironment }) => {
          return {
            environment: await this.environmentService.createEnvironment(localEnvironment, false),
          };
        },
      )
      .otherwise(() => {
        throw new BadRequestException(
          "Either templateId or environment.assetAdministrationShells must be provided",
        );
      });

    const passport = Passport.create({
      organizationId,
      templateId,
      environment,
    });

    const upid = passport.createUniqueProductIdentifier();

    const saved = await this.environmentService.withTransaction(async (options) => {
      await this.uniqueProductIdentifierRepository.save(upid, options);
      const persisted = await this.passportRepository.save(passport, options);
      const snapshotConfigs =
        await this.presentationConfigurationService.snapshotTemplateConfigsToPassport(
          persisted,
          options,
        );
      const configs =
        snapshotConfigs.length > 0
          ? snapshotConfigs
          : [
              await this.presentationConfigurationService.ensureDefaultForPassport(
                persisted,
                options,
              ),
            ];
      await this.permalinkApplicationService.createPermalinksForConfigs(configs, options);
      return persisted;
    });

    return PassportDtoSchema.parse(saved.toPlain());
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
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(
      passport.getEnvironment(),
      pagination,
      subject,
    );
  }

  @ApiPatchShell()
  async modifyShell(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @AssetAdministrationShellIdParam() aasId: string,
    @AssetAdministrationShellModificationRequestBody()
    body: AssetAdministrationShellModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<AssetAdministrationShellResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.modifyShell(
      organizationId,
      id,
      aasId,
      body,
      subject,
    );
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
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(
      passport.getEnvironment(),
      pagination,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.createSubmodel(
      organizationId,
      id,
      body,
      subject,
    );
  }

  @ApiDeletePolicy()
  async deletePolicyBySubjectAndObject(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @DeletePolicyRequestBody() body: DeletePolicyDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    const administrator = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.deletePolicyBySubjectAndObject(
      organizationId,
      id,
      body,
      administrator,
    );
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
    await this.passportService.digitalProductDocumentService.deleteSubmodel(
      organizationId,
      id,
      submodelId,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.modifySubmodel(
      organizationId,
      id,
      submodelId,
      body,
      subject,
    );
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
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.environmentService.getSubmodelById(
      passport.getEnvironment(),
      submodelId,
      subject,
    );
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
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.environmentService.getSubmodelValue(
      passport.getEnvironment(),
      submodelId,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.addColumnToSubmodelElementList(
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      position,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.modifyColumnOfSubmodelElementList(
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfColumn,
      body,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.deleteColumnFromSubmodelElementList(
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfColumn,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.addRowToSubmodelElementList(
      organizationId,
      id,
      submodelId,
      idShortPath,
      position,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.deleteRowFromSubmodelElementList(
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfRow,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.createSubmodelElement(
      organizationId,
      id,
      submodelId,
      body,
      subject,
    );
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
    await this.passportService.digitalProductDocumentService.deleteSubmodelElement(
      organizationId,
      id,
      submodelId,
      idShortPath,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.modifySubmodelElement(
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.modifySubmodelElementValue(
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      subject,
    );
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
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(
      passport.getEnvironment(),
      submodelId,
      pagination,
      subject,
    );
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
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.environmentService.getSubmodelElementById(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
    );
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
    return await this.passportService.digitalProductDocumentService.createSubmodelElementAtIdShortPath(
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      subject,
    );
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
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.environmentService.getSubmodelElementValue(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
    );
  }

  @Get("/:id/export")
  async exportPassport(
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @OrganizationId() organizationId: string,
  ): Promise<any> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const passport =
      await this.passportService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.aasSerializationService.exportPassport(passport, subject);
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
        await this.uniqueProductIdentifierRepository.save(upid, options);
      },
      async (p, options) => {
        const importedConfigs =
          await this.presentationConfigurationService.listForPassportWithSession(p, options);
        const configs =
          importedConfigs.length > 0
            ? importedConfigs
            : [
                await this.presentationConfigurationService.ensureDefaultForPassport(p, options),
              ];
        await this.permalinkApplicationService.createPermalinksForConfigs(configs, options);
      },
    );
    return PassportDtoSchema.parse(passport.toPlain());
  }

  private async loadTemplateAndCheckOwnership(
    id: string,
    subject: SubjectAttributes,
    organizationId: string,
  ): Promise<Template> {
    const template = await this.templateRepository.findOneOrFail(id);
    if (template.getOrganizationId() !== organizationId || subject.memberRole === undefined) {
      throw new ForbiddenException();
    }
    return template;
  }
}
