import { jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { GetMemberOrganizationsHandler } from "./get-member-organizations.handler";
import { GetMemberOrganizationsQuery } from "./get-member-organizations.query";

describe("getMemberOrganizationsHandler", () => {
  let handler: GetMemberOrganizationsHandler;
  let membersRepository: MembersRepositoryPort;
  let organizationsRepository: OrganizationsRepositoryPort;

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
      ],
    }).compile();

    handler = module.get<GetMemberOrganizationsHandler>(GetMemberOrganizationsHandler);
    membersRepository = module.get<MembersRepositoryPort>(MembersRepositoryPort);
    organizationsRepository = module.get<OrganizationsRepositoryPort>(OrganizationsRepositoryPort);
  });

  it("should return organizations for a member", async () => {
    const userId = "user1";
    const members = [{ organizationId: "org1" }, { organizationId: "org2" }];
    const organizations = [{ id: "org1" }, { id: "org2" }];

    (membersRepository.findByUserId as jest.Mock).mockResolvedValue(members);
    (organizationsRepository.findManyByIds as jest.Mock).mockResolvedValue(organizations);

    const query = new GetMemberOrganizationsQuery(userId);
    const result = await handler.execute(query);

    expect(result).toEqual(organizations);
    expect(membersRepository.findByUserId).toHaveBeenCalledWith(userId);
    expect(organizationsRepository.findManyByIds).toHaveBeenCalledWith(["org1", "org2"]);
  });

  it("should return empty array if no members found", async () => {
    const userId = "user1";

    (membersRepository.findByUserId as jest.Mock).mockResolvedValue([]);

    const query = new GetMemberOrganizationsQuery(userId);
    const result = await handler.execute(query);

    expect(result).toEqual([]);
    expect(membersRepository.findByUserId).toHaveBeenCalledWith(userId);
    expect(organizationsRepository.findManyByIds).not.toHaveBeenCalled();
  });
});
