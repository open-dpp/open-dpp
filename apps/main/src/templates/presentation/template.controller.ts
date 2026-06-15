import type {
  ActivityPaginationDto,
  AssetAdministrationShellModificationDto,
  AssetAdministrationShellPaginationResponseDto,
  AssetAdministrationShellResponseDto,
  DeletePolicyDto,
  DigitalProductDocumentStatusDtoType,
  DigitalProductDocumentStatusModificationDto,
  SubmodelElementListResponseDto,
  SubmodelElementModificationDto,
  SubmodelElementPaginationResponseDto,
  SubmodelElementRequestDto,
  SubmodelElementResponseDto,
  SubmodelModificationDto,
  SubmodelPaginationResponseDto,
  SubmodelRequestDto,
  SubmodelResponseDto,
  TemplateCreateDto,
  TemplateDto,
  TemplatePaginationDto,
  ValueRequestDto,
  ValueResponseDto,
} from "@open-dpp/dto";
import {
  DigitalProductDocumentStatusModificationDtoSchema,
  Populates,
  PresentationReferenceType,
  TemplateCreateDtoSchema,
  TemplateDtoSchema,
  TemplatePaginationDtoSchema,
} from "@open-dpp/dto";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";
import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
} from "@nestjs/common";

import { ZodValidationPipe } from "@open-dpp/exception";
import { IdShortPath } from "../../aas/domain/common/id-short-path";
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
  ApiPatchSubmodelValue,
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
  PositionQueryParam,
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
import { Pagination } from "../../pagination/pagination";
import { PagingResult } from "../../pagination/paging-result";
import { PresentationConfigurationService } from "../../presentation-configurations/application/services/presentation-configuration.service";
import { TemplateService } from "../application/template.service";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
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
import type { Response } from "express";
import { CorrelationIdDecorator } from "../../common/decorators/correlation-id.decorator";
import { ActivityTypesType } from "../../activity-history/domain/activities/activity-types";
import { ApiVersion } from "../../common/decorators/api-version.decorator";
import {
  migrateSubmodelElementLinks,
  migrateSubmodelLinks,
  reverseMigrateSubmodelElementLinks,
  reverseMigrateSubmodelLinks,
} from "../../aas/infrastructure/migrate-links";
import { type ApiVersionsType } from "../../api-version";

@Controller({ path: "/templates", version: ["1", "2"] })
export class TemplateController
  implements
    IAasReadEndpointsWithOrganizationId,
    IAasCreateEndpoints,
    IAasModifyEndpoints,
    IAasDeleteEndpoints
{
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly templateRepository: TemplateRepository,
    private readonly templateService: TemplateService,
    private readonly aasSerializationService: AasSerializationService,
    private readonly presentationConfigurationService: PresentationConfigurationService,
  ) {}

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
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getAasShells(
      template.getEnvironment(),
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
    return this.templateService.digitalProductDocumentService.modifyShell(
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
    @ApiVersion() version: ApiVersionsType,
  ): Promise<SubmodelPaginationResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodels(
      template.getEnvironment(),
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
    @ApiVersion() version?: string,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const migratedBody = version === "1" ? reverseMigrateSubmodelLinks(body) : body;
    const response = await this.templateService.digitalProductDocumentService.createSubmodel(
      correlationId,
      organizationId,
      id,
      migratedBody,
      { subject, userId },
    );
    return version === "1" ? migrateSubmodelLinks(response) : response;
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
    await this.templateService.digitalProductDocumentService.deletePolicyBySubjectAndObject(
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
    await this.templateService.digitalProductDocumentService.deleteSubmodel(
      correlationId,
      organizationId,
      id,
      submodelId,
      { subject, userId },
      async (submodelIdShort, options) => {
        await this.presentationConfigurationService.removeElementDesignEntriesForPath(
          PresentationReferenceType.Template,
          id,
          submodelIdShort,
          options,
        );
      },
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
    @ApiVersion() version?: string,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const migratedBody = version === "1" ? reverseMigrateSubmodelLinks(body) : body;
    const response = await this.templateService.digitalProductDocumentService.modifySubmodel(
      correlationId,
      organizationId,
      id,
      submodelId,
      migratedBody,
      { subject, userId },
    );
    return version === "1" ? migrateSubmodelLinks(response) : response;
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
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.templateService.digitalProductDocumentService.modifyValueOfSubmodel(
      correlationId,
      organizationId,
      id,
      submodelId,
      body,
      { subject, userId },
    );
  }

  @ApiGetSubmodelById()
  async getSubmodelById(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @ApiVersion() version: ApiVersionsType,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.environmentService.getSubmodelById(
      template.getEnvironment(),
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
    @ApiVersion() version: ApiVersionsType,
  ): Promise<ValueResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.environmentService.getSubmodelValue(
      template.getEnvironment(),
      submodelId,
      subject,
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
    @ApiVersion() version?: string,
  ): Promise<SubmodelElementPaginationResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    const pagination = Pagination.create({ limit, cursor });
    const response = await this.environmentService.getSubmodelElements(
      template.getEnvironment(),
      submodelId,
      pagination,
      subject,
    );
    if (version === "1") {
      return {
        ...response,
        result: response.result.map(migrateSubmodelElementLinks),
      };
    }
    return response;
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
    @ApiVersion() version?: string,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const migratedBody = version === "1" ? reverseMigrateSubmodelElementLinks(body) : body;
    const response = await this.templateService.digitalProductDocumentService.createSubmodelElement(
      correlationId,
      organizationId,
      id,
      submodelId,
      migratedBody,
      { subject, userId },
    );
    return version === "1" ? migrateSubmodelElementLinks(response) : response;
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
    await this.templateService.digitalProductDocumentService.deleteSubmodelElement(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      { subject, userId },
      async (idShortPathString, options) => {
        await this.presentationConfigurationService.removeElementDesignEntriesForPath(
          PresentationReferenceType.Template,
          id,
          idShortPathString,
          options,
        );
      },
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
    @ApiVersion() version?: string,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const migratedBody = version === "1" ? reverseMigrateSubmodelElementLinks(body) : body;
    const response =
      await this.templateService.digitalProductDocumentService.addColumnToSubmodelElementList(
        correlationId,
        organizationId,
        id,
        submodelId,
        idShortPath,
        migratedBody,
        position,
        { subject, userId },
      );
    return version === "1" ? migrateSubmodelElementLinks(response) : response;
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
    @ApiVersion() version?: string,
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const migratedBody = version === "1" ? reverseMigrateSubmodelLinks(body) : body;
    const response =
      await this.templateService.digitalProductDocumentService.modifyColumnOfSubmodelElementList(
        correlationId,
        organizationId,
        id,
        submodelId,
        idShortPath,
        idShortOfColumn,
        migratedBody,
        { subject, userId },
      );
    return version === "1" ? migrateSubmodelElementLinks(response) : response;
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
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.templateService.digitalProductDocumentService.deleteColumnFromSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfColumn,
      { subject, userId },
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
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.templateService.digitalProductDocumentService.addRowToSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      position,
      { subject, userId },
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
  ): Promise<SubmodelElementListResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.templateService.digitalProductDocumentService.deleteRowFromSubmodelElementList(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfRow,
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
    @ApiVersion() version?: string,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const migratedBody = version === "1" ? reverseMigrateSubmodelElementLinks(body) : body;
    const response = await this.templateService.digitalProductDocumentService.modifySubmodelElement(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      migratedBody,
      { subject, userId },
    );
    return version === "1" ? migrateSubmodelElementLinks(response) : response;
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
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.templateService.digitalProductDocumentService.modifySubmodelElementValue(
      correlationId,
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
      { subject, userId },
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
    @ApiVersion() version: ApiVersionsType,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.environmentService.getSubmodelElementById(
      template.getEnvironment(),
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
    @ApiVersion() version?: string,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const migratedBody = version === "1" ? reverseMigrateSubmodelElementLinks(body) : body;
    const response =
      await this.templateService.digitalProductDocumentService.createSubmodelElementAtIdShortPath(
        correlationId,
        organizationId,
        id,
        submodelId,
        idShortPath,
        migratedBody,
        { subject, userId },
      );
    return version === "1" ? migrateSubmodelElementLinks(response) : response;
  }

  @ApiGetSubmodelElementValue()
  async getSubmodelElementValue(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @IdShortPathParam() idShortPath: IdShortPath,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @ApiVersion() version: ApiVersionsType,
  ): Promise<ValueResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.environmentService.getSubmodelElementValue(
      template.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
      version,
    );
  }

  // REST action pattern like https://blog.ivankahl.com/practical-guide-to-modeling-business-processes-in-rest-apis/.
  @Put(":id/status")
  async modifyTemplateStatus(
    @CorrelationIdDecorator() correlationId: string,
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @UserIdDecorator() userId: string,
    @Body(new ZodValidationPipe(DigitalProductDocumentStatusModificationDtoSchema))
    body: DigitalProductDocumentStatusModificationDto,
  ): Promise<TemplateDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return this.templateService.modifyTemplateStatus(correlationId, organizationId, id, body, {
      subject,
      userId,
    });
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
    return await this.templateService.digitalProductDocumentService.getActivities(
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
    await this.templateService.digitalProductDocumentService.downloadActivities(
      res,
      organizationId,
      id,
      subject,
      startDate,
      endDate,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<void> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    await this.templateService.deleteTemplate(id, organizationId, subject);
  }

  @Post()
  async createTemplate(
    @Body(new ZodValidationPipe(TemplateCreateDtoSchema)) body: TemplateCreateDto,
    @OrganizationId() organizationId: string,
  ): Promise<TemplateDto> {
    const environment = await this.environmentService.createEnvironment(body.environment, true);
    const template = Template.create({ organizationId, environment });
    return TemplateDtoSchema.parse((await this.templateRepository.save(template)).toPlain());
  }

  @Get("/:id/export")
  async exportTemplate(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ) {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return await this.aasSerializationService.exportTemplate(template, subject);
  }

  @Post("/import")
  @HttpCode(HttpStatus.CREATED)
  async importTemplate(@Body() body: any, @OrganizationId() organizationId: string) {
    const template = await this.aasSerializationService.importTemplate(
      body,
      organizationId,
      async (t, options) => {
        await this.templateRepository.save(t, options);
      },
    );
    return TemplateDtoSchema.parse(template.toPlain());
  }

  @Get()
  async getTemplates(
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @PopulateQueryParam() populate: string[],
    @StatusQueryParam() status: DigitalProductDocumentStatusDtoType[] | undefined,
    @OrganizationId() organizationId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<TemplatePaginationDto> {
    const pagination = Pagination.create({ limit, cursor });
    let pagingResult: PagingResult<any> = await this.templateRepository.findAllByOrganizationId(
      organizationId,
      { pagination, ...(status ? { filter: { status } } : {}) },
    );
    const subject = SubjectAttributes.create({ userRole, memberRole });
    if (populate.includes(Populates.assetAdministrationShells) && pagingResult.items.length > 0) {
      pagingResult = await this.environmentService.populateEnvironmentForPagingResult(
        pagingResult,
        { assetAdministrationShells: true, submodels: false, ignoreMissing: false },
        subject,
      );
    }
    return TemplatePaginationDtoSchema.parse(pagingResult.toPlain());
  }

  @Get(":id")
  async getTemplate(
    @OrganizationId() organizationId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Param("id") id: string,
  ): Promise<TemplateDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    return TemplateDtoSchema.parse(template.toPlain());
  }
}
