import type * as authRequest from "@open-dpp/auth";
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from "@nestjs/common";
import { PermissionService } from "@open-dpp/auth";
import { ZodValidationPipe } from "@open-dpp/exception";
import { omit } from "lodash";
import { MarketplaceApplicationService } from "../../marketplace/presentation/marketplace.application.service";
import { TemplateService } from "../../templates/infrastructure/template.service";
import { User } from "../../users/domain/user";
import { DataFieldDraft } from "../domain/data-field-draft";
import { SectionDraft } from "../domain/section-draft";

import { TemplateDraft } from "../domain/template-draft";
import { TemplateDraftService } from "../infrastructure/template-draft.service";

import * as createDataFieldDraftDto_1 from "./dto/create-data-field-draft.dto";
import * as createSectionDraftDto_1 from "./dto/create-section-draft.dto";
import { CreateSectionDraftDtoSchema } from "./dto/create-section-draft.dto";
import * as createTemplateDraftDto_1 from "./dto/create-template-draft.dto";
import * as moveDto_1 from "./dto/move.dto";
import * as publishDto_1 from "./dto/publish.dto";
import { templateDraftToDto } from "./dto/template-draft.dto";
import * as updateDataFieldDraftDto from "./dto/update-data-field-draft.dto";
import * as updateSectionDraftDto from "./dto/update-section-draft.dto";
import * as updateTemplateDraftDto_1 from "./dto/update-template-draft.dto";

@Controller("/organizations/:orgaId/template-drafts")
export class TemplateDraftController {
  private readonly permissionsService: PermissionService;
  private readonly templateService: TemplateService;
  private readonly templateDraftService: TemplateDraftService;
  private readonly marketplaceService: MarketplaceApplicationService;

  constructor(
    permissionsService: PermissionService,
    templateService: TemplateService,
    templateDraftService: TemplateDraftService,
    marketplaceService: MarketplaceApplicationService,
  ) {
    this.permissionsService = permissionsService;
    this.templateService = templateService;
    this.templateDraftService = templateDraftService;
    this.marketplaceService = marketplaceService;
  }

  @Post()
  async create(
    @Param("orgaId") organizationId: string,
    @Request() req: authRequest.AuthRequest,
    @Body(
      new ZodValidationPipe(
        createTemplateDraftDto_1.CreateTemplateDraftDtoSchema,
      ),
    )
    createTemplateDraftDto: createTemplateDraftDto_1.CreateTemplateDraftDto,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    return templateDraftToDto(
      await this.templateDraftService.save(
        TemplateDraft.create({
          ...createTemplateDraftDto,
          organizationId,
          userId: req.authContext.keycloakUser.sub,
        }),
      ),
    );
  }

  @Get(":draftId")
  async get(
    @Param("orgaId") organizationId: string,
    @Param("draftId") draftId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    return templateDraftToDto(foundProductDataModelDraft);
  }

  @Patch(":draftId")
  async modify(
    @Param("orgaId") organizationId: string,
    @Param("draftId") draftId: string,
    @Request() req: authRequest.AuthRequest,
    @Body(
      new ZodValidationPipe(
        updateTemplateDraftDto_1.UpdateTemplateDraftDtoSchema,
      ),
    )
    updateTemplateDraftDto: updateTemplateDraftDto_1.UpdateTemplateDraftDto,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    foundProductDataModelDraft.rename(updateTemplateDraftDto.name);
    await this.templateDraftService.save(foundProductDataModelDraft);

    return templateDraftToDto(foundProductDataModelDraft);
  }

  @Post(":draftId/sections")
  async addSection(
    @Param("orgaId") organizationId: string,
    @Param("draftId") draftId: string,
    @Request() req: authRequest.AuthRequest,
    @Body(new ZodValidationPipe(CreateSectionDraftDtoSchema))
    createSectionDraftDto: createSectionDraftDto_1.CreateSectionDraftDto,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    const section = SectionDraft.create({
      ...omit(createSectionDraftDto, ["parentSectionId"]),
    });

    if (createSectionDraftDto.parentSectionId) {
      foundProductDataModelDraft.addSubSection(
        createSectionDraftDto.parentSectionId,
        section,
      );
    }
    else {
      foundProductDataModelDraft.addSection(section);
    }
    return templateDraftToDto(
      await this.templateDraftService.save(foundProductDataModelDraft),
    );
  }

  @Post(":draftId/publish")
  async publish(
    @Param("orgaId") organizationId: string,
    @Param("draftId") draftId: string,
    @Request() req: authRequest.AuthRequest,
    @Body(new ZodValidationPipe(publishDto_1.PublishDtoSchema))
    publishDto: publishDto_1.PublishDto,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    const publishedProductDataModel = foundProductDataModelDraft.publish(
      req.authContext.keycloakUser.sub,
    );

    if (publishDto.visibility === publishDto_1.VisibilityLevel.PUBLIC) {
      const marketplaceResponse = await this.marketplaceService.upload(
        publishedProductDataModel,
        User.create({
          email: req.authContext.keycloakUser.email,
          keycloakUserId: req.authContext.keycloakUser.sub,
        }),
      );
      publishedProductDataModel.assignMarketplaceResource(
        marketplaceResponse.id,
      );
    }

    await this.templateService.save(publishedProductDataModel);
    const draft = await this.templateDraftService.save(
      foundProductDataModelDraft,
      publishedProductDataModel.version,
    );

    return templateDraftToDto(draft);
  }

  @Post(":draftId/sections/:sectionId/data-fields")
  async addDataFieldToSection(
    @Param("orgaId") organizationId: string,
    @Param("sectionId") sectionId: string,
    @Param("draftId") draftId: string,
    @Request() req: authRequest.AuthRequest,
    @Body(
      new ZodValidationPipe(
        createDataFieldDraftDto_1.CreateDataFieldDraftSchema,
      ),
    )
    createDataFieldDraftDto: createDataFieldDraftDto_1.CreateDataFieldDraftDto,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    const dataField = DataFieldDraft.create(createDataFieldDraftDto);

    foundProductDataModelDraft.addDataFieldToSection(sectionId, dataField);

    return templateDraftToDto(
      await this.templateDraftService.save(foundProductDataModelDraft),
    );
  }

  @Delete(":draftId/sections/:sectionId")
  async deleteSection(
    @Param("orgaId") organizationId: string,
    @Param("sectionId") sectionId: string,
    @Param("draftId") draftId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    foundProductDataModelDraft.deleteSection(sectionId);

    return templateDraftToDto(
      await this.templateDraftService.save(foundProductDataModelDraft),
    );
  }

  @Patch(":draftId/sections/:sectionId")
  async modifySection(
    @Param("orgaId") organizationId: string,
    @Param("sectionId") sectionId: string,
    @Param("draftId") draftId: string,
    @Body(
      new ZodValidationPipe(updateSectionDraftDto.UpdateSectionDraftDtoSchema),
    )
    modifySectionDraftDto: updateSectionDraftDto.UpdateSectionDraftDto,
    @Request() req: authRequest.AuthRequest,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    foundProductDataModelDraft.modifySection(
      sectionId,
      omit(modifySectionDraftDto),
    );

    return templateDraftToDto(
      await this.templateDraftService.save(foundProductDataModelDraft),
    );
  }

  @Post(":draftId/sections/:sectionId/move")
  async moveSection(
    @Param("orgaId") organizationId: string,
    @Param("sectionId") sectionId: string,
    @Param("draftId") draftId: string,
    @Body(new ZodValidationPipe(moveDto_1.MoveDtoSchema))
    moveDto: moveDto_1.MoveDto,
    @Request() req: authRequest.AuthRequest,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    foundProductDataModelDraft.moveSection(sectionId, moveDto.direction);

    return templateDraftToDto(
      await this.templateDraftService.save(foundProductDataModelDraft),
    );
  }

  @Patch(":draftId/sections/:sectionId/data-fields/:fieldId")
  async modifyDataFieldOfSection(
    @Param("orgaId") organizationId: string,
    @Param("sectionId") sectionId: string,
    @Param("draftId") draftId: string,
    @Param("fieldId") fieldId: string,
    @Body(
      new ZodValidationPipe(
        updateDataFieldDraftDto.UpdateDataFieldDraftDtoSchema,
      ),
    )
    modifyDataFieldDraftDto: updateDataFieldDraftDto.UpdateDataFieldDraftDto,
    @Request() req: authRequest.AuthRequest,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    foundProductDataModelDraft.modifyDataField(
      sectionId,
      fieldId,
      omit(modifyDataFieldDraftDto, "view"),
    );

    return templateDraftToDto(
      await this.templateDraftService.save(foundProductDataModelDraft),
    );
  }

  @Post(":draftId/sections/:sectionId/data-fields/:fieldId/move")
  async moveDataField(
    @Param("orgaId") organizationId: string,
    @Param("sectionId") sectionId: string,
    @Param("fieldId") fieldId: string,
    @Param("draftId") draftId: string,
    @Body(new ZodValidationPipe(moveDto_1.MoveDtoSchema))
    moveDto: moveDto_1.MoveDto,
    @Request() req: authRequest.AuthRequest,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    foundProductDataModelDraft.moveDataField(
      sectionId,
      fieldId,
      moveDto.direction,
    );

    return templateDraftToDto(
      await this.templateDraftService.save(foundProductDataModelDraft),
    );
  }

  @Delete(":draftId/sections/:sectionId/data-fields/:fieldId")
  async deleteDataFieldOfSection(
    @Param("orgaId") organizationId: string,
    @Param("sectionId") sectionId: string,
    @Param("draftId") draftId: string,
    @Param("fieldId") fieldId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    const foundProductDataModelDraft
      = await this.templateDraftService.findOneOrFail(draftId);

    this.hasPermissionsOrFail(organizationId, foundProductDataModelDraft);

    foundProductDataModelDraft.deleteDataFieldOfSection(sectionId, fieldId);

    return templateDraftToDto(
      await this.templateDraftService.save(foundProductDataModelDraft),
    );
  }

  @Get()
  async findAllOfOrganization(
    @Param("orgaId") organizationId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    return await this.templateDraftService.findAllByOrganization(
      organizationId,
    );
  }

  private hasPermissionsOrFail(
    organizationId: string,
    templateDraft: TemplateDraft,
  ) {
    if (!templateDraft.isOwnedBy(organizationId)) {
      throw new ForbiddenException();
    }
  }
}
