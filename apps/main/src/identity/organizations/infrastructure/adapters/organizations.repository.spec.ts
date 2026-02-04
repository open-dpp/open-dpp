import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { AUTH } from "../../../auth/auth.provider";
import { Organization } from "../../domain/organization";
import { Organization as OrganizationSchema } from "../schemas/organization.schema";
import { OrganizationsRepository } from "./organizations.repository";

describe("OrganizationsRepository", () => {
  let repository: OrganizationsRepository;
  let mockAuth: any;
  let mockOrganizationModel: any;

  beforeEach(async () => {
    mockAuth = {
      api: {
        createOrganization: jest.fn(),
        updateOrganization: jest.fn(),
        listOrganizations: jest.fn(),
        createInvitation: jest.fn(),
      },
    };

    mockOrganizationModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsRepository,
        {
          provide: AUTH,
          useValue: mockAuth,
        },
        {
          provide: getModelToken(OrganizationSchema.name),
          useValue: mockOrganizationModel,
        },
      ],
    }).compile();

    repository = module.get<OrganizationsRepository>(OrganizationsRepository);
  });

  it("should pass undefined for logo if organization has no logo", async () => {
    const organization = Organization.create({
      name: "Test Org",
      slug: "test-org",
      metadata: {},
    });

    mockAuth.api.createOrganization.mockResolvedValue({
      id: "test-id",
      name: "Test Org",
      slug: "test-org",
      logo: null,
      metadata: "{}",
    });

    await repository.create(organization, {});

    expect(mockAuth.api.createOrganization).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        logo: undefined,
      }),
    }));
  });

  it("should pass undefined for logo in update if data has no logo", async () => {
    mockAuth.api.updateOrganization.mockResolvedValue({});
    mockOrganizationModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([{
        _id: "org-id",
        name: "Test Org",
        slug: "test-org",
        logo: null,
        metadata: {},
      }]),
    });

    await repository.update("org-id", {
      name: "Test Org Updated",
      slug: "test-org",
      logo: null,
    }, {});

    expect(mockAuth.api.updateOrganization).toHaveBeenCalledWith(expect.objectContaining({
      body: expect.objectContaining({
        logo: undefined,
      }),
    }));
  });
});
