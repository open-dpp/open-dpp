import { expect, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationsController } from "./organizations.controller";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { AuthService } from "../../auth/auth.service";
import { OrganizationsService } from "../application/services/organizations.service";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { GetMembersQuery } from "../application/queries/get-members.query";
import { EnvService } from "@open-dpp/env";

describe("OrganizationsController", () => {
    let controller: OrganizationsController;
    let authService: AuthService;
    let queryBus: QueryBus;

    const mockCommandBus = {
        execute: jest.fn<any>(),
    };
    const mockQueryBus = {
        execute: jest.fn<any>(),
    };
    const mockAuthService = {
        getSession: jest.fn<any>(),
        isMemberOfOrganization: jest.fn<any>(),
    };
    const mockOrganizationsService = {
        isOwnerOrAdmin: jest.fn<any>(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrganizationsController],
            providers: [
                { provide: CommandBus, useValue: mockCommandBus },
                { provide: QueryBus, useValue: mockQueryBus },
                { provide: AuthService, useValue: mockAuthService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: OrganizationsService, useValue: mockOrganizationsService },
                { provide: EnvService, useValue: { get: jest.fn() } },
            ],
        }).compile();

        controller = module.get<OrganizationsController>(OrganizationsController);
        authService = module.get<AuthService>(AuthService);
        queryBus = module.get<QueryBus>(QueryBus);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getMembers", () => {
        it("should throw UnauthorizedException if session is missing", async () => {
            const request = {};
            await expect(controller.getMembers("org-1", request)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it("should throw ForbiddenException if user is not a member", async () => {
            const request = {
                session: {
                    user: { id: "user-1" },
                },
            };
            mockAuthService.isMemberOfOrganization.mockResolvedValue(false);

            await expect(controller.getMembers("org-1", request)).rejects.toThrow(
                ForbiddenException,
            );
            expect(authService.isMemberOfOrganization).toHaveBeenCalledWith(
                "user-1",
                "org-1",
            );
        });

        it("should return members if user is a member", async () => {
            const request = {
                session: {
                    user: { id: "user-1" },
                },
            };
            mockAuthService.isMemberOfOrganization.mockResolvedValue(true);
            const expectedMembers = [{ userId: "user-1", organizationId: "org-1" }];
            mockQueryBus.execute.mockResolvedValue(expectedMembers);

            const result = await controller.getMembers("org-1", request);

            expect(result).toEqual(expectedMembers);
            expect(authService.isMemberOfOrganization).toHaveBeenCalledWith(
                "user-1",
                "org-1",
            );
            expect(queryBus.execute).toHaveBeenCalledWith(
                new GetMembersQuery("org-1"),
            );
        });
    });
});
