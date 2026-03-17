import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PolicyKey } from "../domain/policy";
import { PolicyService } from "../infrastructure/policy.service";
import { PolicyGuard } from "./policy.guard";

describe("PolicyGuard", () => {
  let guard: PolicyGuard;
  let reflector: Reflector;
  let policyService: PolicyService;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    policyService = {
      enforce: jest.fn(),
    } as any;

    guard = new PolicyGuard(reflector, policyService);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should enforce policy using organizationId from X-OPEN-DPP-ORGANIZATION-ID header", async () => {
    const context = createMockContext({
      headers: { "x-open-dpp-organization-id": "org-1" },
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);

    await guard.canActivate(context);

    expect(policyService.enforce).toHaveBeenCalledWith("org-1", [PolicyKey.AI_TOKEN_QUOTA]);
  });
});

function createMockContext(req: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
    getHandler: () => {},
    getClass: () => {},
  } as any;
}
