import {
  Controller,
  ForbiddenException,
  Get,
  Param,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { hasPermission, PermissionAction } from "@open-dpp/permission";
import { UserSession } from "../../auth/auth.guard";
import { Session } from "../../auth/session.decorator";
import {
  templateDocumentation,
  templateGetAllDocumentation,
} from "../../open-api-docs/template.doc";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { TemplateService } from "../infrastructure/template.service";
import { templateParamDocumentation, templateToDto } from "./dto/template.dto";

@Controller("/organizations/:organizationId/templates")
export class TemplateController {
  private readonly templateService: TemplateService;
  private readonly organizationsService: OrganizationsService;

  constructor(
    templateService: TemplateService,
    organizationsService: OrganizationsService,
  ) {
    this.templateService = templateService;
    this.organizationsService = organizationsService;
  }

  @ApiOperation({
    summary: "Find template by id",
    description: "Find template by id.",
  })
  @ApiParam(templateParamDocumentation)
  @ApiResponse({
    schema: templateDocumentation,
  })
  @Get(":templateId")
  async get(
    @Param("organizationId") organizationId: string,
    @Param("templateId") id: string,
    @Session() session: UserSession,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: session.user.id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    const found = await this.templateService.findOneOrFail(id);

    if (!found.isOwnedBy(organizationId)) {
      throw new ForbiddenException();
    }

    return templateToDto(found);
  }

  @ApiOperation({
    summary: "Find all templates",
    description: "Find all templates which belong to the user's organization.",
  })
  @ApiResponse({
    schema: templateGetAllDocumentation,
  })
  @Get()
  async getAll(
    @Param("organizationId") organizationId: string,
    @Session() session: UserSession,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: session.user.id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    return await this.templateService.findAllByOrganization(organizationId);
  }
}
