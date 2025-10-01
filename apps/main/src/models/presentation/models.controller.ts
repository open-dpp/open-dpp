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
import { ModelsService } from '../infrastructure/models.service';
import * as createModelDto_1 from './dto/create-model.dto';
import * as updateModelDto_1 from './dto/update-model.dto';
import { Model } from '../domain/model';
import { TemplateService } from '../../templates/infrastructure/template.service';

import { modelToDto } from './dto/model.dto';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import {
  DataValueDto,
  DataValueDtoSchema,
} from '../../product-passport-data/presentation/dto/data-value.dto';
import { DataValue } from '../../product-passport-data/domain/data-value';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  createModelDocumentation,
  modelDocumentation,
  updateModelDocumentation,
} from '../../open-api-docs/model.doc';
import {
  dataValueDocumentation,
  orgaParamDocumentation,
} from '../../product-passport-data/presentation/dto/docs/product-passport-data.doc';
import { modelParamDocumentation } from '../../open-api-docs/item.doc';
import { MarketplaceService } from '../../marketplace/marketplace.service';
import { PermissionService } from '@open-dpp/auth';
import { ZodValidationPipe } from '@open-dpp/exception';
import * as authRequest from '@open-dpp/auth';

@Controller('/organizations/:orgaId/models')
export class ModelsController {
  constructor(
    private readonly modelsService: ModelsService,
    private readonly templateService: TemplateService,
    private readonly permissionsService: PermissionService,
    private readonly marketplaceService: MarketplaceService,
  ) {}

  @ApiOperation({
    summary: 'Create model',
    description: 'Create a model',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiBody({
    schema: createModelDocumentation,
  })
  @ApiResponse({
    schema: modelDocumentation,
  })
  @Post()
  async create(
    @Param('orgaId') organizationId: string,
    @Body(new ZodValidationPipe(createModelDto_1.CreateModelDtoSchema))
    createModelDto: createModelDto_1.CreateModelDto,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    // Validate that only one of templateId or marketplaceResourceId is provided
    if (!createModelDto.templateId && !createModelDto.marketplaceResourceId) {
      throw new BadRequestException(
        'Either templateId or marketplaceResourceId must be provided',
      );
    }

    if (createModelDto.templateId && createModelDto.marketplaceResourceId) {
      throw new BadRequestException(
        'Only one of templateId or marketplaceResourceId can be provided, not both',
      );
    }

    let template;

    if (createModelDto.templateId) {
      template = await this.templateService.findOneOrFail(
        createModelDto.templateId,
      );
    } else if (!createModelDto.marketplaceResourceId) {
      throw new BadRequestException(
        'One of templateId or marketplaceResourceId must be provided, but not both',
      );
    } else {
      template = await this.marketplaceService.download(
        organizationId,
        req.authContext.keycloakUser.sub,
        createModelDto.marketplaceResourceId,
      );
    }
    if (!template.isOwnedBy(organizationId)) {
      throw new ForbiddenException();
    }
    const model = Model.create({
      name: createModelDto.name,
      description: createModelDto.description,
      userId: req.authContext.keycloakUser.sub,
      organizationId: organizationId,
      template,
    });
    model.createUniqueProductIdentifier();
    return modelToDto(await this.modelsService.save(model));
  }

  @ApiOperation({
    summary: 'Find models of organization',
    description: 'Find all models which belong to the provided organization.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiResponse({
    schema: { type: 'array', items: modelDocumentation },
  })
  @Get()
  async findAll(
    @Param('orgaId') organizationId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    return (await this.modelsService.findAllByOrganization(organizationId)).map(
      (m) => modelToDto(m),
    );
  }

  @ApiOperation({
    summary: 'Find model by id',
    description: 'Find model by id.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiResponse({
    schema: modelDocumentation,
  })
  @Get(':modelId')
  async findOne(
    @Param('orgaId') organizationId: string,
    @Param('modelId') id: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const model = await this.modelsService.findOneOrFail(id);
    if (!model.isOwnedBy(organizationId)) {
      throw new ForbiddenException();
    }
    return modelToDto(model);
  }

  @ApiOperation({
    summary: 'Update model',
    description: "Update model's name and description.",
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiBody({
    schema: updateModelDocumentation,
  })
  @ApiResponse({
    schema: modelDocumentation,
  })
  @Patch(':modelId')
  async update(
    @Param('orgaId') organizationId: string,
    @Param('modelId') modelId: string,
    @Body(new ZodValidationPipe(updateModelDto_1.UpdateModelDtoSchema))
    updateModelDto: updateModelDto_1.UpdateModelDto,
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

    if (updateModelDto.name) {
      model.rename(updateModelDto.name);
    }
    if (updateModelDto.description) {
      model.modifyDescription(updateModelDto.description);
    }
    return modelToDto(await this.modelsService.save(model));
  }

  @ApiOperation({
    summary: 'Modify data values of model',
    description: 'Modify data values of model.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiBody({
    schema: { type: 'array', items: { ...dataValueDocumentation } },
  })
  @ApiResponse({
    schema: modelDocumentation,
  })
  @Patch(':modelId/data-values')
  async updateDataValues(
    @Param('orgaId') organizationId: string,
    @Param('modelId') modelId: string,
    @Body(new ZodValidationPipe(DataValueDtoSchema.array()))
    updateDataValues: DataValueDto[],
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

    model.modifyDataValues(updateDataValues.map((d) => DataValue.create(d)));
    const template = await this.templateService.findOneOrFail(model.templateId);
    const validationResult = template.validate(
      model.dataValues,
      GranularityLevel.MODEL,
    );
    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.toJson());
    }
    return modelToDto(await this.modelsService.save(model));
  }

  @ApiOperation({
    summary: 'Add data values to model',
    description:
      'Add data values to model. This method is used in the context of a repeater where a user can add new data rows resulting in data values.',
  })
  @ApiParam(orgaParamDocumentation)
  @ApiParam(modelParamDocumentation)
  @ApiBody({
    schema: { type: 'array', items: { ...dataValueDocumentation } },
  })
  @ApiResponse({
    schema: modelDocumentation,
  })
  @Post(':modelId/data-values')
  async addDataValues(
    @Param('orgaId') organizationId: string,
    @Param('modelId') modelId: string,
    @Body(new ZodValidationPipe(DataValueDtoSchema.array()))
    addDataValues: DataValueDto[],
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    const model = await this.modelsService.findOneOrFail(modelId);
    if (model.ownedByOrganizationId !== organizationId) {
      throw new ForbiddenException();
    }
    model.addDataValues(addDataValues.map((d) => DataValue.create(d)));
    const template = await this.templateService.findOneOrFail(model.templateId);
    const validationResult = template.validate(
      model.dataValues,
      GranularityLevel.MODEL,
    );
    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.toJson());
    }
    return modelToDto(await this.modelsService.save(model));
  }
}
