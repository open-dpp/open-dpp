import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MembersService } from "../../identity/organizations/application/services/members.service";
import { PolicyKey } from "../domain/policy";
import { PolicyService } from "../infrastructure/policy.service";
import { POLICY_META } from "./policy.decorator";
import { LimitExceededException } from "./policy.exception";

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policy: PolicyService,
    private membersService: MembersService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const keys = this.reflector.getAllAndOverride<PolicyKey[]>(POLICY_META, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) ?? [];

    if (!keys.length)
      return true;

    const orgId = req.headers["x-open-dpp-organization-id"];

    if (!orgId || typeof orgId !== "string") {
      throw new BadRequestException(
        "X-OPEN-DPP-ORGANIZATION-ID header is required",
      );
    }

    const session = req.session;
    if (!session) {
      throw new ForbiddenException("Authentication required for policy-protected resources");
    }

    const isMember = await this.membersService.isMemberOfOrganization(session.userId, orgId);
    if (!isMember) {
      throw new ForbiddenException("Not a member of organization");
    }

    const result = await this.policy.enforce(orgId, keys);
    if (result) {
      throw new LimitExceededException(result);
    }

    // stash for interceptor consumption
    req._policyKeys = keys;
    req._orgId = orgId;
    return true;
  }
}
