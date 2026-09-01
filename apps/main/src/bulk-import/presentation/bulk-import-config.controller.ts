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
  Query,
} from "@nestjs/common";
import type {
  BulkImportConfigCreateDto,
  BulkImportConfigDto,
  BulkImportConfigPaginationDto,
  BulkImportConfigUpdateDto,
} from "@open-dpp/dto";
import {
  BulkImportConfigCreateDtoSchema,
  BulkImportConfigDtoSchema,
  BulkImportConfigPaginationDtoSchema,
  BulkImportConfigUpdateDtoSchema,
} from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { BulkImportConfigService } from "../application/services/bulk-import-config.service";

@Controller("bulk-import/configs")
export class BulkImportConfigController {
  constructor(private readonly bulkImportConfigService: BulkImportConfigService) {}

  @Post()
  async createConfig(
    @OrganizationId() organizationId: string,
    @Body(new ZodValidationPipe(BulkImportConfigCreateDtoSchema)) body: BulkImportConfigCreateDto,
  ): Promise<BulkImportConfigDto> {
    const config = await this.bulkImportConfigService.createConfig({
      organizationId,
      templateId: body.templateId,
      name: body.name,
      idField: body.idField,
      submodelMappings: body.submodelMappings,
      inputSample: body.inputSample,
    });
    return BulkImportConfigDtoSchema.parse(config.toPlain());
  }

  @Get()
  async getConfigs(
    @OrganizationId() organizationId: string,
    @Query("templateId") templateId: string | undefined,
  ): Promise<BulkImportConfigPaginationDto> {
    const configs = await this.bulkImportConfigService.findAllByOrganizationId(
      organizationId,
      templateId,
    );
    return BulkImportConfigPaginationDtoSchema.parse({
      paging_metadata: { cursor: null },
      result: configs.map((config) => config.toPlain()),
    });
  }

  @Get(":id")
  async getConfig(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
  ): Promise<BulkImportConfigDto> {
    const config = await this.bulkImportConfigService.findById(id, organizationId);
    return BulkImportConfigDtoSchema.parse(config.toPlain());
  }

  @Put(":id")
  async updateConfig(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(BulkImportConfigUpdateDtoSchema)) body: BulkImportConfigUpdateDto,
  ): Promise<BulkImportConfigDto> {
    const config = await this.bulkImportConfigService.updateConfig(id, organizationId, {
      name: body.name,
      idField: body.idField,
      submodelMappings: body.submodelMappings,
      inputSample: body.inputSample,
    });
    return BulkImportConfigDtoSchema.parse(config.toPlain());
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfig(
    @OrganizationId() organizationId: string,
    @Param("id") id: string,
  ): Promise<void> {
    await this.bulkImportConfigService.deleteConfig(id, organizationId);
  }
}
