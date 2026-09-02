import { Body, Controller, Get, Param, Patch, UnauthorizedException } from "@nestjs/common";
import type { SetPolicyLimitsDto } from "@open-dpp/dto";
import { SetPolicyLimitsDtoSchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { OrganizationId } from "../../identity/auth/presentation/decorators/organization-id.decorator";
import { UserHasRole } from "../../identity/auth/presentation/decorators/user-has-role.decorator";
import { UserRole, UserRoleType } from "../../identity/users/domain/user-role.enum";
import { PolicyService } from "../infrastructure/policy.service";
import { UserRoleDecorator } from "../../identity/auth/presentation/decorators/user-role.decorator";

@Controller("policies")
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get("organizations/:organizationId")
  async getPolicies(
    @OrganizationId() organizationId: string,
    @UserRoleDecorator() userRole: UserRoleType,
    @Param("organizationId") paramOrganizationId: string,
  ) {
    if (paramOrganizationId !== organizationId && userRole !== "admin") {
      throw new UnauthorizedException();
    }

    return await this.policyService.getPolicyUtilization(organizationId);
  }

  @Patch("organizations/:organizationId/limits")
  @UserHasRole([UserRole.ADMIN])
  async setLimits(
    @Param("organizationId") organizationId: string,
    @Body(new ZodValidationPipe(SetPolicyLimitsDtoSchema)) body: SetPolicyLimitsDto,
  ) {
    return await this.policyService.setLimits(organizationId, body);
  }
}
