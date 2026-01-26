import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationsService } from "./organizations.service";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { OrganizationRole } from "../../domain/organization-role.enum";

describe("OrganizationsService", () => {
    let service: OrganizationsService;
    let membersRepository: MembersRepositoryPort;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrganizationsService,
                {
                    provide: MembersRepositoryPort,
                    useValue: {
                        findOneByUserIdAndOrganizationId: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OrganizationsService>(OrganizationsService);
        membersRepository = module.get<MembersRepositoryPort>(MembersRepositoryPort);
    });

    it("should return true if user is owner", async () => {
        jest.spyOn(membersRepository, "findOneByUserIdAndOrganizationId").mockResolvedValue({
            role: OrganizationRole.OWNER,
        } as any);

        const result = await service.isOwnerOrAdmin("orgId", "userId");
        expect(result).toBe(true);
    });

    it("should return true if user is admin", async () => {
        jest.spyOn(membersRepository, "findOneByUserIdAndOrganizationId").mockResolvedValue({
            role: OrganizationRole.ADMIN,
        } as any);

        const result = await service.isOwnerOrAdmin("orgId", "userId");
        expect(result).toBe(true);
    });

    it("should return false if user is member", async () => {
        jest.spyOn(membersRepository, "findOneByUserIdAndOrganizationId").mockResolvedValue({
            role: OrganizationRole.MEMBER,
        } as any);

        const result = await service.isOwnerOrAdmin("orgId", "userId");
        expect(result).toBe(false);
    });

    it("should return false if member not found", async () => {
        jest.spyOn(membersRepository, "findOneByUserIdAndOrganizationId").mockResolvedValue(null);

        const result = await service.isOwnerOrAdmin("orgId", "userId");
        expect(result).toBe(false);
    });
});
