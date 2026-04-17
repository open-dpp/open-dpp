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
import type express from "express";
import type { MemberRoleType } from "../../identity/organizations/domain/member-role.enum";

import type { UserRoleType } from "../../identity/users/domain/user-role.enum";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
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
import { parseSubmodelElement } from "../../aas/domain/submodel-base/submodel-base";
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
    private readonly uniqueProductIdentifierService: UniqueProductIdentifierRepository,
    private readonly passportService: PassportService,
    private readonly aasSerializationService: AasSerializationService,
  ) {}

  @Get()
  async getPassports(
    @LimitQueryParam() limit: number | undefined,
    @CursorQueryParam() cursor: string | undefined,
    @PopulateQueryParam() populate: string[],
    @StatusQueryParam() status: DigitalProductDocumentStatusDtoType | undefined,
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
    await this.passportService.loadPassportAndCheckOwnership(id, subject, organizationId);
    const upi = await this.uniqueProductIdentifierService.findOneByReferencedId(id);
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.modifyAasShell(
      passport.getEnvironment(),
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.addSubmodelToEnvironment(
      passport.getEnvironment(),
      body,
      this.saveEnvironmentCallback(passport),
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
    const subject = SubjectAttributes.fromPlain(body.subject);
    const object = IdShortPath.create({ path: body.object });
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      administrator,
      organizationId,
    );
    await this.environmentService.deletePolicyBySubjectAndObject(
      passport.getEnvironment(),
      object,
      subject,
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    await this.environmentService.deleteSubmodelFromEnvironment(
      passport.getEnvironment(),
      submodelId,
      this.saveEnvironmentCallback(passport),
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.modifySubmodel(
      passport.getEnvironment(),
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    const column = parseSubmodelElement(body);
    return await this.environmentService.addColumn(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      column,
      subject,
      position,
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.modifyColumn(
      passport.getEnvironment(),
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.deleteColumn(
      passport.getEnvironment(),
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.addRow(
      passport.getEnvironment(),
      submodelId,
      idShortPath,
      subject,
      position,
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.deleteRow(
      passport.getEnvironment(),
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.addSubmodelElement(
      passport.getEnvironment(),
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    await this.environmentService.deleteSubmodelElement(
      passport.getEnvironment(),
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.modifySubmodelElement(
      passport.getEnvironment(),
      submodelId,
      body,
      idShortPath,
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.modifyValueOfSubmodelElement(
      passport.getEnvironment(),
      submodelId,
      body,
      idShortPath,
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
      id,
      subject,
      organizationId,
    );
    return await this.environmentService.addSubmodelElement(
      passport.getEnvironment(),
      submodelId,
      body,
      subject,
      idShortPath,
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
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
    const passport = await this.passportService.loadPassportAndCheckOwnership(
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
        await this.uniqueProductIdentifierService.save(upid, options);
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

  private saveEnvironmentCallback(passport: Passport) {
    return async (options: DbSessionOptions) => {
      await this.passportRepository.save(passport, options);
    };
  }
}
