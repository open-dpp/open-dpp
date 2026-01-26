import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { BetterAuthOrganizationsRepository } from "../../infrastructure/adapters/better-auth-organizations.repository";
import { ORGANIZATIONS_REPO_BETTER_AUTH } from "../../organizations.constants";
import { GetMemberOrganizationsHandler } from "./get-member-organizations.handler";
import { GetMemberOrganizationsQuery } from "./get-member-organizations.query";

describe("getMemberOrganizationsHandler", () => {
  let handler: GetMemberOrganizationsHandler;
  let betterAuthOrganizationsRepository: BetterAuthOrganizationsRepository;

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
    betterAuthOrganizationsRepository = module.get<BetterAuthOrganizationsRepository>(ORGANIZATIONS_REPO_BETTER_AUTH);
  });

  it("should return organizations for a member via better-auth", async () => {
    const userId = "user1";
    const headers = { cookie: "session=123" };
    const organizations = [{ id: "org1" }, { id: "org2" }];

    (betterAuthOrganizationsRepository.findManyByMember as jest.Mock).mockResolvedValue(organizations as any);

    const query = new GetMemberOrganizationsQuery("user-1");
    const result = await handler.execute(query);

    expect(result).toEqual(organizations);
    expect(betterAuthOrganizationsRepository.findManyByMember).toHaveBeenCalledWith("user-1");
  });
});
