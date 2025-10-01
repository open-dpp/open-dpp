import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { ItemsService } from '../infrastructure/items.service';
import { itemToDto } from './dto/item.dto';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { TemplateService } from '../../templates/infrastructure/template.service';
import {
  DataValueDto,
  DataValueDtoSchema,
} from '../../product-passport-data/presentation/dto/data-value.dto';
import { ModelsService } from '../../models/infrastructure/models.service';
import { DataValue } from '../../product-passport-data/domain/data-value';
import { ItemsApplicationService } from './items-application.service';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  itemDocumentation,
  itemParamDocumentation,
  modelParamDocumentation,
} from '../../open-api-docs/item.doc';
import {
  dataValueDocumentation,
  orgaParamDocumentation,
} from '../../product-passport-data/presentation/dto/docs/product-passport-data.doc';
import { ZodValidationPipe } from '@open-dpp/exception';
import { PermissionService } from '@open-dpp/auth';
import * as authRequest from '@open-dpp/auth';

@Controller('organizations/:orgaId/models/:modelId/items')
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly permissionsService: PermissionService,
    private readonly itemsApplicationService: ItemsApplicationService,
    private readonly modelsService: ModelsService,
    private readonly templateService: TemplateService,
  ) {}

  @ApiOperation({
    summary: 'Create a new item',
    description:
      'Creates a new item for the specified model. It uses the template of the model.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiResponse({
    schema: itemDocumentation,
  })
  @Post()
  async create(
    @Param('orgaId') organizationId: string,
    @Param('modelId') modelId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const item = await this.itemsApplicationService.createItem(
      organizationId,
      modelId,
      req.authContext.keycloakUser.sub,
    );
    return itemToDto(await this.itemsService.save(item));
  }

  @ApiOperation({
    summary: 'Find items of model',
    description: 'Find all item which belong to the specified model.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiResponse({
    schema: { type: 'array', items: { ...itemDocumentation } },
  })
  @Get()
  async getAll(
    @Param('orgaId') organizationId: string,
    @Param('modelId') modelId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const model = await this.modelsService.findOneOrFail(modelId);
    if (!model.isOwnedBy(organizationId)) {
      throw new ForbiddenException();
    }
    return (await this.itemsService.findAllByModel(modelId)).map((item) =>
      itemToDto(item),
    );
  }

  @ApiOperation({
    summary: 'Find item by id',
    description: 'Find and return the item with the requested id.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiParam(itemParamDocumentation)
  @ApiResponse({
    schema: itemDocumentation,
  })
  @Get(':itemId')
  async get(
    @Param('orgaId') organizationId: string,
    @Param('modelId') modelId: string,
    @Param('itemId') itemId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const item = await this.itemsService.findOneOrFail(itemId);
    if (!item.isOwnedBy(organizationId) || item.modelId !== modelId) {
      throw new ForbiddenException();
    }
    return itemToDto(item);
  }

  @ApiOperation({
    summary: 'Add data values to item',
    description:
      'Add data values to item. This method is used in the context of a repeater where a user can add new data rows resulting in data values.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiParam(itemParamDocumentation)
  @ApiBody({
    schema: { type: 'array', items: { ...dataValueDocumentation } },
  })
  @ApiResponse({
    schema: itemDocumentation,
  })
  @Post(':itemId/data-values')
  async addDataValues(
    @Param('orgaId') organizationId: string,
    @Param('modelId') modelId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(DataValueDtoSchema.array()))
    addDataValues: DataValueDto[],
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const item = await this.itemsService.findOneOrFail(itemId);
    if (!item.isOwnedBy(organizationId) || item.modelId !== modelId) {
      throw new ForbiddenException();
    }
    item.addDataValues(addDataValues.map((d) => DataValue.create(d)));
    if (!item.templateId) {
      throw new BadRequestException('Item does not have a template assigned');
    }
    const productDataModel = await this.templateService.findOneOrFail(
      item.templateId,
    );

    const validationResult = productDataModel.validate(
      item.dataValues,
      GranularityLevel.ITEM,
    );
    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.toJson());
    }

    return itemToDto(await this.itemsService.save(item));
  }

  @ApiOperation({
    summary: 'Modify data values of item',
    description: 'Modify data values of item.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiParam(itemParamDocumentation)
  @ApiBody({
    schema: { type: 'array', items: { ...dataValueDocumentation } },
  })
  @ApiResponse({
    schema: itemDocumentation,
  })
  @Patch(':itemId/data-values')
  async updateDataValues(
    @Param('orgaId') organizationId: string,
    @Param('modelId') modelId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(DataValueDtoSchema.array()))
    updateDataValues: DataValueDto[],
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const item = await this.itemsService.findOneOrFail(itemId);
    if (!item.isOwnedBy(organizationId) || item.modelId !== modelId) {
      throw new ForbiddenException();
    }

    item.modifyDataValues(updateDataValues.map((d) => DataValue.create(d)));
    if (!item.templateId) {
      throw new BadRequestException('Item does not have a template assigned');
    }
    const productDataModel = await this.templateService.findOneOrFail(
      item.templateId,
    );

    const validationResult = productDataModel.validate(
      item.dataValues,
      GranularityLevel.ITEM,
    );
    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.toJson());
    }

    return itemToDto(await this.itemsService.save(item));
  }
}
