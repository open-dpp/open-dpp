import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { ObjectId } from "mongodb";
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
      metadata: {},
    });

    mockAuth.api.createOrganization.mockResolvedValue({
      id: new ObjectId().toString(),
      name: "Test Org",
      slug: "test-org",
      logo: null,
      metadata: "{}",
      createdAt: new Date(),
    });

    await repository.create(organization, {});

    expect(mockAuth.api.createOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          logo: undefined,
        }),
      }),
    );
  });

  it("should pass undefined for logo in update if organization has no logo", async () => {
    const organizationObjectId = new ObjectId();
    const organization = Organization.loadFromDb({
      id: organizationObjectId.toString(),
      name: "Test Org Updated",
      slug: "test-org",
      logo: null,
      metadata: {},
      createdAt: new Date(),
    });

    mockAuth.api.updateOrganization.mockResolvedValue({});
    mockOrganizationModel.findOne.mockResolvedValue({
      _id: organizationObjectId,
      name: "Test Org Updated",
      slug: "test-org",
      logo: null,
      metadata: JSON.stringify({}),
      createdAt: new Date(),
    });

    await repository.update(organization, {});

    expect(mockAuth.api.updateOrganization).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          data: expect.objectContaining({
            name: "Test Org Updated",
            logo: "",
          }),
          organizationId: organizationObjectId.toString(),
        }),
      }),
    );
  });

  it("sends a unique placeholder slug to better-auth on create", async () => {
    mockAuth.api.createOrganization.mockResolvedValue({
      id: new ObjectId().toString(),
      name: "Test Org",
      slug: "irrelevant",
      logo: null,
      metadata: "{}",
      createdAt: new Date(),
    });

    await repository.create(Organization.create({ name: "Test Org", metadata: {} }), {});
    await repository.create(Organization.create({ name: "Test Org", metadata: {} }), {});

    const slugs = mockAuth.api.createOrganization.mock.calls.map(
      ([call]: [{ body: { slug: string } }]) => call.body.slug,
    );
    expect(slugs).toHaveLength(2);
    expect(slugs[0]).toEqual(expect.any(String));
    expect(slugs[0].length).toBeGreaterThan(0);
    expect(slugs[0]).not.toEqual(slugs[1]);
  });

  it("returns the identity better-auth persisted, with slug equal to id", async () => {
    const placeholder = Organization.create({ name: "Test Org", metadata: {} });
    const persistedId = new ObjectId().toHexString();
    mockAuth.api.createOrganization.mockResolvedValue({
      id: persistedId,
      name: "Test Org",
      slug: persistedId,
      logo: null,
      metadata: "{}",
      createdAt: new Date(),
    });

    const created = await repository.create(placeholder, {});

    expect(created?.id).toEqual(persistedId);
    expect(created?.slug).toEqual(persistedId);
    expect(created?.id).not.toEqual(placeholder.id);
  });

  it("does not send a slug on update", async () => {
    const organizationObjectId = new ObjectId();
    const organization = Organization.loadFromDb({
      id: organizationObjectId.toString(),
      name: "Test Org",
      slug: organizationObjectId.toString(),
      logo: null,
      metadata: {},
      createdAt: new Date(),
    });
    mockAuth.api.updateOrganization.mockResolvedValue({});
    mockOrganizationModel.findOne.mockResolvedValue(null);

    await repository.update(organization, {});

    const [call] = mockAuth.api.updateOrganization.mock.calls[0] as [{ body: { data: object } }];
    expect(call.body.data).not.toHaveProperty("slug");
  });
});
