import { Body, Controller, ForbiddenException, Get, Param, Put } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { hasPermission, PermissionAction } from "@open-dpp/permission";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { OrganizationsService } from "../../../organizations/infrastructure/organizations.service";
import { AiConfiguration } from "../domain/ai-configuration";
import { AiConfigurationService } from "../infrastructure/ai-configuration.service";
import * as aiConfigurationDto from "./dto/ai-configuration.dto";
import { AiConfigurationUpsertDtoSchema } from "./dto/ai-configuration.dto";

@Controller("organizations/:organizationId/configurations")
export class AiConfigurationController {
  private readonly aiConfigurationService: AiConfigurationService;
  private readonly organizationsService: OrganizationsService;

  constructor(
    aiConfigurationService: AiConfigurationService,
    organizationsService: OrganizationsService,
  ) {
    this.aiConfigurationService = aiConfigurationService;
    this.organizationsService = organizationsService;
  }

  @Put()
  async upsertConfiguration(
    @Param("organizationId") organizationId: string,
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(AiConfigurationUpsertDtoSchema))
    aiConfigurationUpsertDto: aiConfigurationDto.AiConfigurationUpsertDto,
  ) {
    const organization = await this.organizationsService.findOneOrFail(organizationId);
    if (!hasPermission({
      user: {
        id: session.user.id,
      },
    }, PermissionAction.READ, organization.toPermissionSubject())) {
      throw new ForbiddenException();
    }

    let aiConfiguration
      = await this.aiConfigurationService.findOneByOrganizationId(organizationId);

    if (aiConfiguration) {
      aiConfiguration.update(aiConfigurationUpsertDto);
    }
    else {
      aiConfiguration = AiConfiguration.create({
        ownedByOrganizationId: organizationId,
        createdByUserId: session.user.id,
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
    return aiConfigurationDto.aiConfigurationToDto(
      await this.aiConfigurationService.findOneByOrganizationIdOrFail(
        organizationId,
      ),
    );
  }
}
