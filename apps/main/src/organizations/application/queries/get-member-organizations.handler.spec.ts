import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
// Removed concrete import to avoid transitive dependencies on better-auth
import { ORGANIZATIONS_REPO_BETTER_AUTH } from "../../organizations.constants";
import { GetMemberOrganizationsHandler } from "./get-member-organizations.handler";
import { GetMemberOrganizationsQuery } from "./get-member-organizations.query";

jest.mock("../../infrastructure/adapters/better-auth-organizations.repository", () => ({
  BetterAuthOrganizationsRepository: jest.fn(),
}));
jest.mock("../../../auth/auth.provider", () => ({
  AUTH: "auth",
  AuthProvider: {},
}));

describe("getMemberOrganizationsHandler", () => {
  let handler: GetMemberOrganizationsHandler;
  let betterAuthOrganizationsRepository: OrganizationsRepositoryPort;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMemberOrganizationsHandler,
        {
          provide: MembersRepositoryPort,
          useValue: {
            findByUserId: jest.fn(),
          },
        },
        {
          provide: OrganizationsRepositoryPort,
          useValue: {
            findManyByIds: jest.fn(),
          },
        },
        {
          provide: ORGANIZATIONS_REPO_BETTER_AUTH,
          useValue: {
            findManyByMember: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetMemberOrganizationsHandler>(GetMemberOrganizationsHandler);
    betterAuthOrganizationsRepository = module.get(ORGANIZATIONS_REPO_BETTER_AUTH);
  });

  it("should return organizations for a member via better-auth", async () => {
    const userId = "user1";
    const headers = { cookie: "session=123" };
    const organizations = [{ id: "org1" }, { id: "org2" }];

    (betterAuthOrganizationsRepository.findManyByMember as unknown as jest.Mock).mockResolvedValue(organizations as any);

    const query = new GetMemberOrganizationsQuery(userId, headers);
    const result = await handler.execute(query);

    expect(result).toEqual(organizations);
    expect(betterAuthOrganizationsRepository.findManyByMember).toHaveBeenCalledWith(headers);
  });
});
