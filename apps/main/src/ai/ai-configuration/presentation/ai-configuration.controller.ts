import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { Session } from "../../../identity/auth/domain/session";
import { AuthSession } from "../../../identity/auth/presentation/decorators/auth-session.decorator";
import { AiConfiguration } from "../domain/ai-configuration";
import { AiConfigurationService } from "../infrastructure/ai-configuration.service";
import * as aiConfigurationDto from "./dto/ai-configuration.dto";
import { AiConfigurationUpsertDtoSchema } from "./dto/ai-configuration.dto";

@Controller("organizations/:organizationId/configurations")
export class AiConfigurationController {
  private readonly aiConfigurationService: AiConfigurationService;

  constructor(
    aiConfigurationService: AiConfigurationService,
  ) {
    this.aiConfigurationService = aiConfigurationService;
  }

  @Put()
  async upsertConfiguration(
    @Param("organizationId") organizationId: string,
    @AuthSession() session: Session,
    @Body(new ZodValidationPipe(AiConfigurationUpsertDtoSchema))
    aiConfigurationUpsertDto: aiConfigurationDto.AiConfigurationUpsertDto,
  ) {
    let aiConfiguration
      = await this.aiConfigurationService.findOneByOrganizationId(organizationId);

    if (aiConfiguration) {
      aiConfiguration.update(aiConfigurationUpsertDto);
    }
    else {
      aiConfiguration = AiConfiguration.create({
        ownedByOrganizationId: organizationId,
        createdByUserId: session.userId,
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
  ) {
    return aiConfigurationDto.aiConfigurationToDto(
      await this.aiConfigurationService.findOneByOrganizationIdOrFail(
        organizationId,
      ),
    );
  }
}
