import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PolicyKey } from "./domain/policy";
import { PolicyService } from "./infrastructure/policy.service";
import { POLICY_META } from "./policy.decorator";

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private reflector: Reflector, private policy: PolicyService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const keys = this.reflector.getAllAndOverride<PolicyKey[]>(POLICY_META, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) ?? [];

    if (!keys.length)
      return true;

    const orgId = req.params.organizationId || req.params.orgaId || req.params.orgId;

    try {
      await this.policy.enforce(orgId, keys);
    }
    catch (error) {
      throw new ForbiddenException(error.message);
    }

    // stash for interceptor consumption
    req._policyKeys = keys;
    req._orgId = orgId;
    return true;
  }
}
