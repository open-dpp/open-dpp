import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MembersService } from "../../identity/organizations/application/services/members.service";
import { PolicyKey } from "../domain/policy";
import { PolicyService } from "../infrastructure/policy.service";
import { PolicyGuard } from "./policy.guard";

describe("PolicyGuard", () => {
  let guard: PolicyGuard;
  let reflector: Reflector;
  let policyService: PolicyService;
  let membersService: MembersService;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    policyService = {
      enforce: jest.fn(),
    } as any;
    membersService = {
      isMemberOfOrganization: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
    } as any;

    guard = new PolicyGuard(reflector, policyService, membersService);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should enforce policy using organizationId from X-OPEN-DPP-ORGANIZATION-ID header", async () => {
    const context = createMockContext({
      headers: { "x-open-dpp-organization-id": "org-1" },
      session: { userId: "user-1" },
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);

    await guard.canActivate(context);

    expect(membersService.isMemberOfOrganization).toHaveBeenCalledWith("user-1", "org-1");
    expect(policyService.enforce).toHaveBeenCalledWith("org-1", [PolicyKey.AI_TOKEN_QUOTA]);
  });

  it("should skip checks when no policy keys are defined", async () => {
    const context = createMockContext({
      headers: {},
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(policyService.enforce).not.toHaveBeenCalled();
  });

  it("should throw BadRequestException when orgId header is missing", async () => {
    const context = createMockContext({
      headers: {},
      session: { userId: "user-1" },
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);

    await expect(guard.canActivate(context)).rejects.toThrow(BadRequestException);
  });

  it("should throw ForbiddenException when session is missing", async () => {
    const context = createMockContext({
      headers: { "x-open-dpp-organization-id": "org-1" },
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it("should throw ForbiddenException when session exists but userId is missing", async () => {
    const context = createMockContext({
      headers: { "x-open-dpp-organization-id": "org-1" },
      session: {},
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(membersService.isMemberOfOrganization).not.toHaveBeenCalled();
  });

  it("should throw ForbiddenException when user is not a member of organization", async () => {
    const context = createMockContext({
      headers: { "x-open-dpp-organization-id": "org-1" },
      session: { userId: "user-1" },
    });

    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([PolicyKey.AI_TOKEN_QUOTA]);
    (membersService.isMemberOfOrganization as jest.Mock).mockResolvedValue(false as never);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(policyService.enforce).not.toHaveBeenCalled();
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
