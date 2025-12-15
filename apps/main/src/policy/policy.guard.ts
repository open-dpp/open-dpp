import { CanActivate, ExecutionContext, ForbiddenException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Cap } from "./domain/cap";
import { Quota } from "./domain/quota";
import { PolicyService } from "./infrastructure/policy.service";
import { POLICY_KEY, PolicyRule } from "./policy.decorator";

// policy.guard.ts
@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policies: PolicyService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const rule = this.reflector.getAllAndOverride<PolicyRule>(
      POLICY_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!rule)
      return true;

    const orgId = req.params.organizationId;
    if (!orgId) {
      throw new InternalServerErrorException("Organization ID not set");
    }

    if (rule.cap) {
      let cap = await this.policies.getCap(orgId, rule.cap.key);
      if (!cap) {
        cap = Cap.create({
          key: rule.cap.key,
          limit: rule.cap.defaultlimit,
        });

        cap = await this.policies.saveCap(orgId, cap);
      }

      if (cap.isReached()) {
        throw new ForbiddenException("Resource cap reached");
      }
    }

    if (rule.quota) {
      let quota = await this.policies.getQuota(orgId, rule.quota.key);
      if (!quota) {
        quota = Quota.create({
          key: rule.quota.key,
          limit: rule.quota.defaultlimit,
          period: rule.quota.period,
        });

        quota = await this.policies.saveQuota(orgId, quota);
      }

      if (quota.isExceeded()) {
        throw new ForbiddenException("Quota exceeded");
      }
    }

    return true;
  }
}
