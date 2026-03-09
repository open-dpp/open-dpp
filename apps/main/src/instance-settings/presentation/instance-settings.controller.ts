import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { z } from "zod";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { Roles } from "../../identity/auth/presentation/decorators/roles.decorator";
import { InstanceSettingsService } from "../application/services/instance-settings.service";
import { InstanceSettings } from "../domain/instance-settings";

const UpdateInstanceSettingsDtoSchema = z.object({
  signupEnabled: z.boolean().optional(),
});

type UpdateInstanceSettingsDto = z.infer<typeof UpdateInstanceSettingsDtoSchema>;

@Controller("instance-settings")
export class InstanceSettingsController {
  constructor(
    private readonly instanceSettingsService: InstanceSettingsService,
  ) {}

  @Get()
  @Roles(["admin"])
  async getSettings(): Promise<InstanceSettings> {
    return this.instanceSettingsService.getSettings();
  }

  @Patch()
  @Roles(["admin"])
  async updateSettings(
    @Body(new ZodValidationPipe(UpdateInstanceSettingsDtoSchema)) body: UpdateInstanceSettingsDto,
  ): Promise<InstanceSettings> {
    return this.instanceSettingsService.updateSettings(body);
  }

  @Get("public")
  @AllowAnonymous()
  async getPublicSettings(): Promise<{ signupEnabled: boolean }> {
    const settings = await this.instanceSettingsService.getSettings();
    return { signupEnabled: settings.signupEnabled };
  }
}
