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

  it("should enforce policy using organizationId from params", async () => {
    const context = createMockContext({
      params: { organizationId: "org-1" },
    });

    // Mock reflector to return some keys so enforce is called
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);

    await guard.canActivate(context);

    expect(policyService.enforce).toHaveBeenCalledWith("org-1", [PolicyKey.AI_TOKEN_QUOTA]);
  });

  it("should enforce policy using orgaId from params (reproduction)", async () => {
    const context = createMockContext({
      params: { orgaId: "org-2" },
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);

    await guard.canActivate(context);

    expect(policyService.enforce).toHaveBeenCalledWith("org-2", [PolicyKey.AI_TOKEN_QUOTA]);
  });

  it("should enforce policy using orgId from params", async () => {
    const context = createMockContext({
      params: { orgId: "org-3" },
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);

    await guard.canActivate(context);

    expect(policyService.enforce).toHaveBeenCalledWith("org-3", [PolicyKey.AI_TOKEN_QUOTA]);
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
