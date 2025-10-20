import type {
  ExecutionContext,
} from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { expect } from "@jest/globals";
import { HttpModule } from "@nestjs/axios";
import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { EnvModule } from "@open-dpp/env";
import { IS_PUBLIC } from "../public/public.decorator";
import { KeycloakAuthGuard } from "./keycloak-auth.guard";

describe("keycloakAuthGuard", () => {
  let guard: KeycloakAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule, EnvModule.forRoot()],
      providers: [
        KeycloakAuthGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<KeycloakAuthGuard>(KeycloakAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    let context: ExecutionContext;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };
      context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => ({}),
      } as unknown as ExecutionContext;
    });

    it("should return true for public routes", async () => {
      jest.spyOn(reflector, "get").mockReturnValue(true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith(IS_PUBLIC, expect.any(Object));
    });

    it("should throw unauthorized exception when authorization header is missing", async () => {
      jest.spyOn(reflector, "get").mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new HttpException("Authorization missing", HttpStatus.UNAUTHORIZED),
      );
    });

    it("should throw unauthorized exception when authorization format is invalid", async () => {
      jest.spyOn(reflector, "get").mockReturnValue(false);
      mockRequest.headers.authorization = "InvalidFormat";

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException(
          "Authorization: Bearer <token> header invalid",
        ),
      );
    });
  });
});
