import {
  Controller,
  ForbiddenException,
  Get,
  Param,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import {
  templateDocumentation,
  templateGetAllDocumentation,
} from "../../open-api-docs/template.doc";
import { TemplateService } from "../infrastructure/template.service";
import { templateParamDocumentation, templateToDto } from "./dto/template.dto";

@Controller("/organizations/:organizationId/templates")
export class TemplateController {
  private readonly templateService: TemplateService;

  constructor(
    templateService: TemplateService,
  ) {
    this.templateService = templateService;
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
  ) {
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
  ) {
    return await this.templateService.findAllByOrganization(organizationId);
  }
}
