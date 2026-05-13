import type {
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
  ValueModificationRequestBody,
  SubmodelIdParam,
  SubmodelModificationRequestBody,
  SubmodelRequestBody,
  ApiPatchSubmodelValue,
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
import { TemplateService } from "../application/template.service";
import { Template } from "../domain/template";
import { TemplateRepository } from "../infrastructure/template.repository";
import {
  PopulateQueryParam,
  StatusQueryParam,
} from "../../digital-product-document/presentation/digital-product-document-decorators";

@Controller("/templates")
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
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @AssetAdministrationShellIdParam() aasId: string,
    @AssetAdministrationShellModificationRequestBody()
    body: AssetAdministrationShellModificationDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<AssetAdministrationShellResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return this.templateService.digitalProductDocumentService.modifyShell(
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
    return await this.templateService.digitalProductDocumentService.createSubmodel(
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
    await this.templateService.digitalProductDocumentService.deletePolicyBySubjectAndObject(
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
    await this.templateService.digitalProductDocumentService.deleteSubmodel(
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
    return await this.templateService.digitalProductDocumentService.modifySubmodel(
      organizationId,
      id,
      submodelId,
      body,
      subject,
    );
  }

  @ApiPatchSubmodelValue()
  async modifyValueOfSubmodel(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @SubmodelIdParam() submodelId: string,
    @ValueModificationRequestBody() body: ValueRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.templateService.digitalProductDocumentService.modifyValueOfSubmodel(
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
    const template =
      await this.templateService.digitalProductDocumentService.loadDigitalProductDocumentAndCheckOwnership(
        id,
        subject,
        organizationId,
      );
    const pagination = Pagination.create({ limit, cursor });
    return await this.environmentService.getSubmodelElements(
      template.getEnvironment(),
      submodelId,
      pagination,
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
    return await this.templateService.digitalProductDocumentService.createSubmodelElement(
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
    await this.templateService.digitalProductDocumentService.deleteSubmodelElement(
      organizationId,
      id,
      submodelId,
      idShortPath,
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
    return await this.templateService.digitalProductDocumentService.addColumnToSubmodelElementList(
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
    return await this.templateService.digitalProductDocumentService.modifyColumnOfSubmodelElementList(
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
    return await this.templateService.digitalProductDocumentService.deleteColumnFromSubmodelElementList(
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
    return await this.templateService.digitalProductDocumentService.addRowToSubmodelElementList(
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
    return await this.templateService.digitalProductDocumentService.deleteRowFromSubmodelElementList(
      organizationId,
      id,
      submodelId,
      idShortPath,
      idShortOfRow,
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
    return await this.templateService.digitalProductDocumentService.modifySubmodelElement(
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
    @ValueModificationRequestBody() body: ValueRequestDto,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
  ): Promise<SubmodelElementResponseDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return await this.templateService.digitalProductDocumentService.modifySubmodelElementValue(
      organizationId,
      id,
      submodelId,
      idShortPath,
      body,
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
    return await this.templateService.digitalProductDocumentService.createSubmodelElementAtIdShortPath(
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
    );
  }

  // REST action pattern like https://blog.ivankahl.com/practical-guide-to-modeling-business-processes-in-rest-apis/.
  @Put(":id/status")
  async modifyTemplateStatus(
    @OrganizationId() organizationId: string,
    @IdParam() id: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @MemberRoleDecorator() memberRole: MemberRoleType | undefined,
    @Body(new ZodValidationPipe(DigitalProductDocumentStatusModificationDtoSchema))
    body: DigitalProductDocumentStatusModificationDto,
  ): Promise<TemplateDto> {
    const subject = SubjectAttributes.create({ userRole, memberRole });
    return this.templateService.modifyTemplateStatus(id, organizationId, subject, body);
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
