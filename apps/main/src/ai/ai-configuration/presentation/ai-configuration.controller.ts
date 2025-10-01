import { Body, Controller, Get, Param, Put, Request } from '@nestjs/common';
import { AiConfigurationService } from '../infrastructure/ai-configuration.service';
import * as aiConfigurationDto from './dto/ai-configuration.dto';
import { AiConfiguration } from '../domain/ai-configuration';
import { PermissionService } from '@open-dpp/auth';
import * as authRequest from '@open-dpp/auth';
import { ZodValidationPipe } from '@open-dpp/exception';
import { AiConfigurationUpsertDtoSchema } from './dto/ai-configuration.dto';

@Controller('organizations/:organizationId/configurations')
export class AiConfigurationController {
  constructor(
    private aiConfigurationService: AiConfigurationService,
    private permissionsService: PermissionService,
  ) {}

  @Put()
  async upsertConfiguration(
    @Param('organizationId') organizationId: string,
    @Request() req: authRequest.AuthRequest,
    @Body(new ZodValidationPipe(AiConfigurationUpsertDtoSchema))
    aiConfigurationUpsertDto: aiConfigurationDto.AiConfigurationUpsertDto,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );

    let aiConfiguration =
      await this.aiConfigurationService.findOneByOrganizationId(organizationId);

    if (aiConfiguration) {
      aiConfiguration.update(aiConfigurationUpsertDto);
    } else {
      aiConfiguration = AiConfiguration.create({
        ownedByOrganizationId: organizationId,
        createdByUserId: req.authContext.keycloakUser.sub,
        provider: aiConfigurationUpsertDto.provider,
        model: aiConfigurationUpsertDto.model,
        isEnabled: aiConfigurationUpsertDto.isEnabled,
      });
    }

    return aiConfigurationDto.aiConfigurationToDto(
      await this.aiConfigurationService.save(aiConfiguration),
    );
  }

  @Get()
  async findConfigurationByOrganization(
    @Param('organizationId') organizationId: string,
    @Request() req: authRequest.AuthRequest,
  ) {
    await this.permissionsService.canAccessOrganizationOrFail(
      organizationId,
      req.authContext,
    );
    return aiConfigurationDto.aiConfigurationToDto(
      await this.aiConfigurationService.findOneByOrganizationIdOrFail(
        organizationId,
      ),
    );
  }
}
