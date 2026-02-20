import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";

const mockHandler = jest.fn();
const mockToNodeHandler = jest.fn().mockReturnValue(mockHandler);

// Mocking ESM module
jest.unstable_mockModule("better-auth/node", () => ({
  toNodeHandler: mockToNodeHandler,
}));

describe("AuthController", () => {
  let AuthController: any;
  let AUTH: any;
  let betterAuthNode: any;

  let controller: any;
  let mockAuth: any;

  beforeEach(async () => {
    // Dynamic imports after mocking
    const controllerModule = await import("./auth.controller");
    AuthController = controllerModule.AuthController;
    const providerModule = await import("../auth.provider");
    AUTH = providerModule.AUTH;
    betterAuthNode = await import("better-auth/node");

    mockAuth = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AUTH,
          useValue: mockAuth,
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it("should handle POST requests using better-auth handler", async () => {
    const req = { method: "POST" } as any;
    const res = { status: jest.fn() } as any;

    await controller.handleBetterAuthPostRequest(req, res);

    expect(betterAuthNode.toNodeHandler).toHaveBeenCalledWith(mockAuth);
    expect(mockHandler).toHaveBeenCalledWith(req, res);
  });

  it("should handle GET requests using better-auth handler", async () => {
    const req = { method: "GET" } as any;
    const res = { status: jest.fn() } as any;

    await controller.handleBetterAuthGetRequest(req, res);

    expect(betterAuthNode.toNodeHandler).toHaveBeenCalledWith(mockAuth);
    expect(mockHandler).toHaveBeenCalledWith(req, res);
  });
});
