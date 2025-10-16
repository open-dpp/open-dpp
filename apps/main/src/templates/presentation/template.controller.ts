import type * as authRequest from "@open-dpp/auth";
import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Request,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import { hasPermission, PermissionAction } from "@open-dpp/permission";
import {
  templateDocumentation,
  templateGetAllDocumentation,
} from "../../open-api-docs/template.doc";
import { OrganizationsService } from "../../organizations/infrastructure/organizations.service";
import { User } from "../../users/domain/user";
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
    @Request() req: authRequest.AuthRequest,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
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
    @Request() req: authRequest.AuthRequest,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: (req.authContext.user as User).id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }
    return await this.templateService.findAllByOrganization(organizationId);
  }
}
