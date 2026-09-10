import type {
  ActivityPaginationDto,
  ApiVersionsDtoType,
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellResponseDto,
  CreateGroupFromColumnDto,
  DeletePolicyDto,
  DigitalProductDocumentStatusDtoType,
  DigitalProductDocumentStatusModificationDto,
  MoveSubmodelDto,
  MoveSubmodelElementDto,
  PassportDto,
  ReorderColumnDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelModificationDto,
  SubmodelPaginationResponseDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
  ValueRequestDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import {
  AllApiVersions,
  DigitalProductDocumentStatusModificationDtoSchema,
  PassportDtoSchema,
  PassportPaginationDtoSchema,
  PassportRequestCreateDtoSchema,
  Populates,
} from "@open-dpp/dto";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import { type Response } from "express";

import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Res,
} from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { match, P } from "ts-pattern";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
import { SubjectAttributes } from "../../aas/domain/security/subject-attributes";
import { AasSerializationService } from "../../aas/infrastructure/serialization/aas-serialization.service";
import {
  ApiCreateGroupFromColumn,
  ApiDeleteColumn,
  ApiDeleteColumnFromGroup,
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
  ApiMoveColumnToGroup,
  ApiMoveSubmodel,
  ApiMoveSubmodelElement,
  ApiPatchColumn,
  ApiReorderColumn,
  ApiPatchColumnInGroup,
  ApiPatchShell,
  ApiPatchSubmodel,
  ApiPatchSubmodelElement,
  ApiPatchSubmodelElementValue,
  ApiPatchSubmodelValue,
  ApiPostColumn,
  ApiPostColumnToGroup,
  ApiPostRow,
  ApiPostSubmodel,
  ApiPostSubmodelElement,
  ApiPostSubmodelElementAtIdShortPath,
  AssetAdministrationShellIdParam,
  AssetAdministrationShellModificationRequestBody,
  ColumnParam,
  CreateGroupFromColumnRequestBody,
  CursorQueryParam,
  DeletePolicyRequestBody,
  GroupIdShortParam,
  GroupIdShortQueryParam,
  IdParam,
  IdShortPathParam,
  MoveSubmodelElementRequestBody,
  MoveSubmodelRequestBody,
  PositionQueryParam,
  ReorderColumnRequestBody,
  RowParam,
  SubmodelElementModificationRequestBody,
  SubmodelElementRequestBody,
  SubmodelIdParam,
  SubmodelModificationRequestBody,
  SubmodelRequestBody,
  ValueModificationRequestBody,
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
import { PassportService } from "../application/services/passport.service";
import { PassportRepository } from "../infrastructure/passport.repository";
import {
  ActivityPathQueryParam,
  ActivityTypeQueryParam,
  ApiDownloadActivities,
  ApiGetActivities,
  EndDateQueryParam,
  LimitQueryParam,
  PopulateQueryParam,
  StartDateQueryParam,
  StatusQueryParam,
} from "../../digital-product-document/presentation/digital-product-document-decorators";
import { UserIdDecorator } from "../../identity/auth/presentation/decorators/user-id.decorator";
import { CorrelationIdDecorator } from "../../common/decorators/correlation-id.decorator";
import { ActivityTypesType } from "../../activity-history/domain/activities/activity-types";
import { ApiVersion } from "../../common/decorators/api-version.decorator";

@Controller({ path: "/passports", version: AllApiVersions })
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
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @Body(new ZodValidationPipe(DigitalProductDocumentStatusModificationDtoSchema))
    body: DigitalProductDocumentStatusModificationDto,
  ): Promise<PassportDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return this.passportService.modifyPassportStatus(correlationId, organizationId, id, body, {
      subject,
      userId,
    });
  }

  @Post()
  async createPassport(
    @OrganizationId() organizationId: string,
    @Body(new ZodValidationPipe(PassportRequestCreateDtoSchema)) body: PassportRequestCreateDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<PassportDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });

    return await match(body)
      .returnType<Promise<PassportDto>>()
      .with({ templateId: P.string }, async ({ templateId }) => {
        const passport = await this.passportService.createPassportFromTemplate(
          organizationId,
          templateId,
          subject,
        );
        return PassportDtoSchema.parse(passport.toPlain());
      })
      .with(
        {
          environment: { assetAdministrationShells: P.array() },
        },
        async ({ environment: localEnvironment }) => {
          const environment = await this.environmentService.createEnvironment(
            localEnvironment,
            false,
          );
          const passport = await this.passportService.createAndPersistPassport(
            organizationId,
            environment,
          );
          return PassportDtoSchema.parse(passport.toPlain());
        },
      )
      .otherwise(() => {
        throw new BadRequestException(
          "Either templateId or environment.assetAdministrationShells must be provided",
        );
      });
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
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @AssetAdministrationShellIdParam() aasId: string,
    @AssetAdministrationShellModificationRequestBody()
    body: AssetAdministrationShellModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
  ): Promise<AssetAdministrationShellResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.modifyShell(
      correlationId,
      organizationId,
      id,
      aasId,
      body,
      { subject, userId },
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
    @ApiVersion() version: ApiVersionsDtoType,
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
      version,
    );
  }

  @ApiPostSubmodel()
  async createSubmodel(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelRequestBody() body: SubmodelRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.createSubmodel(
      correlationId,
      organizationId,
      id,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiDeletePolicy()
  async deletePolicyBySubjectAndObject(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @DeletePolicyRequestBody() body: DeletePolicyDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.deletePolicyBySubjectAndObject(
      correlationId,
      organizationId,
      id,
      body,
      { subject, userId },
    );
  }

  @ApiDeleteSubmodelById()
  async deleteSubmodel(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.deleteSubmodel(
      correlationId,
      organizationId,
      id,
      submodelId,
      { subject, userId },
    );
  }

  @ApiPatchSubmodel()
  async modifySubmodel(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelModificationRequestBody() body: SubmodelModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.modifySubmodel(
      correlationId,
      organizationId,
      id,
      submodelId,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiMoveSubmodel()
  async moveSubmodel(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @MoveSubmodelRequestBody() body: MoveSubmodelDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.moveSubmodel(
      correlationId,
      organizationId,
      id,
      submodelId,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiPatchSubmodelValue()
  async modifyValueOfSubmodel(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @ValueModificationRequestBody() body: ValueRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.modifyValueOfSubmodel(
      correlationId,
      organizationId,
      id,
      submodelId,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiGetSubmodelById()
  async getSubmodelById(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @ApiVersion() version: ApiVersionsDtoType,
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
      version,
    );
  }

  @ApiGetSubmodelValue()
  async getSubmodelValue(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @ApiVersion() version: ApiVersionsDtoType,
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
      version,
    );
  }

  @ApiPostColumn()
  async addColumnToSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @PositionQueryParam() position: number | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.addColumnToSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      position,
      { subject, userId },
      version,
    );
  }

  @ApiPatchColumn()
  async modifyColumnOfSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.modifyColumnOfSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfColumn,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiReorderColumn()
  async reorderColumn(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @GroupIdShortQueryParam() groupIdShort: string | undefined,
    @ReorderColumnRequestBody() body: ReorderColumnDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.reorderColumn(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfColumn,
      groupIdShort,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiDeleteColumn()
  async deleteColumnFromSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ColumnParam() idShortOfColumn: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.deleteColumnFromSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfColumn,
      { subject, userId },
      version,
    );
  }

  @ApiPostColumnToGroup()
  async addColumnToGroupInSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @GroupIdShortParam() groupIdShort: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @PositionQueryParam() position: number | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.addColumnToGroupInSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      groupIdShort,
      body,
      position,
      { subject, userId },
      version,
    );
  }

  @ApiPatchColumnInGroup()
  async modifyColumnInGroupOfSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @GroupIdShortParam() groupIdShort: string,
    @ColumnParam() idShortOfColumn: string,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.modifyColumnInGroupOfSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      groupIdShort,
      idShortOfColumn,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiDeleteColumnFromGroup()
  async deleteColumnFromGroupInSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @GroupIdShortParam() groupIdShort: string,
    @ColumnParam() idShortOfColumn: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.deleteColumnFromGroupInSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      groupIdShort,
      idShortOfColumn,
      { subject, userId },
      version,
    );
  }

  @ApiMoveColumnToGroup()
  async moveColumnToGroupInSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @GroupIdShortParam() groupIdShort: string,
    @ColumnParam() columnIdShort: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.moveColumnToGroupInSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      groupIdShort,
      columnIdShort,
      { subject, userId },
      version,
    );
  }

  @ApiCreateGroupFromColumn()
  async createGroupFromColumnInSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @CreateGroupFromColumnRequestBody() body: CreateGroupFromColumnDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.createGroupFromColumnInSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      body.columnIdShort,
      body.group,
      { subject, userId },
      version,
    );
  }

  @ApiPostRow()
  async addRowToSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @PositionQueryParam() position: number | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.addRowToSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      position,
      { subject, userId },
      version,
    );
  }

  @ApiDeleteRow()
  async deleteRowFromSubmodelElementList(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @RowParam() idShortOfRow: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.deleteRowFromSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfRow,
      { subject, userId },
      version,
    );
  }

  @ApiPostSubmodelElement()
  async createSubmodelElement(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.createSubmodelElement(
      correlationId,
      organizationId,
      id,
      submodelId,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiDeleteSubmodelElementById()
  async deleteSubmodelElement(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.deleteSubmodelElement(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      { subject, userId },
    );
  }

  @ApiPatchSubmodelElement()
  async modifySubmodelElement(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementModificationRequestBody() body: SubmodelElementModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.modifySubmodelElement(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiPatchSubmodelElementValue()
  async modifySubmodelElementValue(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @ValueModificationRequestBody() body: ValueRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.modifySubmodelElementValue(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      { subject, userId },
      version,
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
    @ApiVersion() version: ApiVersionsDtoType,
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
      version,
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
    @ApiVersion() version: ApiVersionsDtoType,
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
      version,
    );
  }

  @ApiPostSubmodelElementAtIdShortPath()
  async createSubmodelElementAtIdShortPath(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @SubmodelElementRequestBody() body: SubmodelElementRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.createSubmodelElementAtIdShortPath(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      { subject, userId },
      version,
    );
  }

  @ApiMoveSubmodelElement()
  async moveSubmodelElement(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @MoveSubmodelElementRequestBody() body: MoveSubmodelElementDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @ApiVersion() version: ApiVersionsDtoType,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.moveSubmodelElement(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      { subject, userId },
      version,
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
    @ApiVersion() version: ApiVersionsDtoType,
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
      version,
    );
  }

  @ApiGetActivities()
  async getActivities(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @StartDateQueryParam() startDate: string | undefined,
    @EndDateQueryParam() endDate: string | undefined,
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @ActivityTypeQueryParam() activityType: ActivityTypesType[] | undefined,
    @ActivityPathQueryParam() dppPathFilter: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<ActivityPaginationDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.passportService.digitalProductDocumentService.getActivities(
      organizationId,
      id,
      subject,
      startDate,
      endDate,
      limit,
      cursor,
      activityType,
      dppPathFilter,
    );
  }

  @ApiDownloadActivities()
  async downloadActivities(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @StartDateQueryParam() startDate: string | undefined,
    @EndDateQueryParam() endDate: string | undefined,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.passportService.digitalProductDocumentService.downloadActivities(
      res,
      organizationId,
      id,
      subject,
      startDate,
      endDate,
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
        // Imports do not auto-mint a canonical UPI either.
        await this.passportRepository.save(p, options);
      },
      async (p, options) => {
        const importedConfigs = await this.presentationConfigurationService.findExistingForPassport(
          p,
          options,
        );
        const configs =
          importedConfigs.length > 0
            ? importedConfigs
            : [await this.presentationConfigurationService.ensureDefaultForPassport(p, options)];
        await this.permalinkApplicationService.createPermalinksForConfigs(
          configs,
          organizationId,
          options,
        );
      },
    );
    return PassportDtoSchema.parse(passport.toPlain());
  }
}
