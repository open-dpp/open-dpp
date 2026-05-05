import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ZodValidationPipe } from "@open-dpp/exception";
import { AllowAnonymous } from "../../identity/auth/presentation/decorators/allow-anonymous.decorator";
import { UserHasRole } from "../../identity/auth/presentation/decorators/user-has-role.decorator";
import { UserRole, type UserRoleType } from "../../identity/users/domain/user-role.enum";
import { InstanceSettingsService } from "../application/services/instance-settings.service";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";
import {
  type InstanceSettingsDto,
  InstanceSettingsDtoSchema,
  type InstanceSettingsUpdateDto,
  InstanceSettingsUpdateDtoSchema,
  type PublicInstanceSettingsDto,
  PublicInstanceSettingsDtoSchema,
} from "@open-dpp/dto";

@Controller("instance-settings")
export class InstanceSettingsController {
  constructor(private readonly instanceSettingsService: InstanceSettingsService) {}

  @Get()
  @UserHasRole([UserRole.ADMIN])
  async getSettings(): Promise<InstanceSettingsDto> {
    const settings = await this.instanceSettingsService.getSettings();
    return InstanceSettingsDtoSchema.parse(settings.toResponse());
  }

  @Patch()
  @UserHasRole([UserRole.ADMIN])
  async updateSettings(
    @Body(new ZodValidationPipe(InstanceSettingsUpdateDtoSchema)) body: InstanceSettingsUpdateDto,
  ): Promise<InstanceSettingsDto> {
    const settings = await this.instanceSettingsService.updateSettings(body);
    return InstanceSettingsDtoSchema.parse(settings.toResponse());
  }

  @Get("public")
  @AllowAnonymous()
  async getPublicSettings(
    @UserRoleDecorator() userRole: UserRoleType,
  ): Promise<PublicInstanceSettingsDto> {
    const settings = await this.instanceSettingsService.getSettings();
    const settingsVisibleToRegisteredUsers =
      userRole !== UserRole.ANONYMOUS
        ? { organizationCreationEnabled: settings.organizationCreationEnabled.value }
        : {};
    return PublicInstanceSettingsDtoSchema.parse({
      signupEnabled: settings.signupEnabled.value,
      ...settingsVisibleToRegisteredUsers,
    });
  }
}
