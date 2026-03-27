import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { z } from "zod";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { UserHasRole } from "../../identity/auth/presentation/decorators/user-has-role.decorator";
import { UserRole } from "../../identity/users/domain/user-role.enum";
import { InstanceSettingsService } from "../application/services/instance-settings.service";
import { InstanceSettingsResponseProps } from "../domain/instance-settings";

const UpdateInstanceSettingsDtoSchema = z.object({
  signupEnabled: z.boolean().optional(),
});

type UpdateInstanceSettingsDto = z.infer<typeof UpdateInstanceSettingsDtoSchema>;

@Controller("instance-settings")
export class InstanceSettingsController {
  constructor(private readonly instanceSettingsService: InstanceSettingsService) {}

  @Get()
  @UserHasRole([UserRole.ADMIN])
  async getSettings(): Promise<InstanceSettingsResponseProps> {
    const settings = await this.instanceSettingsService.getSettings();
    return settings.toResponse();
  }

  @Patch()
  @UserHasRole([UserRole.ADMIN])
  async updateSettings(
    @Body(new ZodValidationPipe(UpdateInstanceSettingsDtoSchema)) body: UpdateInstanceSettingsDto,
  ): Promise<InstanceSettingsResponseProps> {
    const settings = await this.instanceSettingsService.updateSettings(body);
    return settings.toResponse();
  }

  @Get("public")
  @AllowAnonymous()
  async getPublicSettings(): Promise<{ signupEnabled: boolean }> {
    const settings = await this.instanceSettingsService.getSettings();
    return { signupEnabled: settings.signupEnabled.value };
  }
}
