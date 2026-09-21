import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { LatestApiVersionWithPrefixDto } from "@open-dpp/dto";

const mockHandler = jest.fn();
const mockToNodeHandler = jest.fn().mockReturnValue(mockHandler);

// Mocking ESM module
jest.unstable_mockModule("better-auth/node", () => ({
  toNodeHandler: mockToNodeHandler,
}));

const authUrl = (path: string) => `/api/${LatestApiVersionWithPrefixDto}/auth${path}`;

describe("AuthController", () => {
  let AuthController: any;
  let AUTH: any;
  let betterAuthNode: any;

  let controller: any;
  let mockAuth: any;
  let signupEnabled: boolean;

  beforeEach(async () => {
    mockHandler.mockClear();
    mockToNodeHandler.mockClear();
    signupEnabled = true;

    // Dynamic imports after mocking
    const controllerModule = await import("./auth.controller");
    AuthController = controllerModule.AuthController;
    const providerModule = await import("../auth.provider");
    AUTH = providerModule.AUTH;
    betterAuthNode = await import("better-auth/node");

    mockAuth = {};

    const instanceSettingsModule =
      await import("../../../instance-settings/application/services/instance-settings.service");
    const InstanceSettingsService = instanceSettingsModule.InstanceSettingsService;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AUTH,
          useValue: mockAuth,
        },
        {
          provide: InstanceSettingsService,
          useValue: {
            getSettings: jest.fn(async () => ({ signupEnabled: { value: signupEnabled } })),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  const post = (url: string) => {
    const req = { method: "POST", url } as any;
    const res = { status: jest.fn() } as any;
    return controller.handleBetterAuthPostRequest(req, res).then(() => ({ req, res }));
  };

  it("should handle POST requests using better-auth handler", async () => {
    const { req, res } = await post(authUrl("/some-path"));

    expect(betterAuthNode.toNodeHandler).toHaveBeenCalledWith(mockAuth);
    expect(mockHandler).toHaveBeenCalledWith(req, res);
  });

  it("should handle GET requests using better-auth handler", async () => {
    const req = { method: "GET", url: authUrl("/some-path") } as any;
    const res = { status: jest.fn() } as any;

    await controller.handleBetterAuthGetRequest(req, res);

    expect(betterAuthNode.toNodeHandler).toHaveBeenCalledWith(mockAuth);
    expect(mockHandler).toHaveBeenCalledWith(req, res);
  });

  it.each([
    "/organization/create",
    "/organization/update",
    "/organization/check-slug",
    "/organization/update?organizationId=1",
  ])("rejects the raw better-auth route POST %s with 403", async (path) => {
    await expect(post(authUrl(path))).rejects.toThrow(ForbiddenException);

    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("passes look-alike organization routes through to better-auth", async () => {
    const { req, res } = await post(authUrl("/organization/update-member-role"));

    expect(mockHandler).toHaveBeenCalledWith(req, res);
  });

  it("rejects email sign-up while signup is disabled", async () => {
    signupEnabled = false;

    await expect(post(authUrl("/sign-up/email"))).rejects.toThrow(ForbiddenException);

    expect(mockHandler).not.toHaveBeenCalled();
  });
});
