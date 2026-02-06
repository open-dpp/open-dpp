import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { Invitation } from "../../domain/invitation";
import { Invitation as InvitationSchema } from "../schemas/invitation.schema";
import { InvitationsRepository } from "./invitations.repository";

describe("InvitationsRepository", () => {
  let repository: InvitationsRepository;
  let mockInvitationModel: any;

  beforeEach(async () => {
    mockInvitationModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsRepository,
        {
          provide: getModelToken(InvitationSchema.name),
          useValue: mockInvitationModel,
        },
      ],
    }).compile();

    repository = module.get<InvitationsRepository>(InvitationsRepository);
  });

  it("should find one by id", async () => {
    const doc = {
      _id: "invitation-1",
      email: "test@example.com",
      organizationId: "org-1",
      inviterId: "user-1",
      role: "member",
      createdAt: new Date(),
      expiresAt: new Date(),
    };
    mockInvitationModel.findById.mockResolvedValue(doc);

    const result = await repository.findOneById("invitation-1");

    expect(result).toBeInstanceOf(Invitation);
    expect(result?.id).toBe("invitation-1");
    expect(mockInvitationModel.findById).toHaveBeenCalledWith("invitation-1");
  });

  it("should return null if not found by id", async () => {
    mockInvitationModel.findById.mockResolvedValue(null);

    const result = await repository.findOneById("invitation-1");

    expect(result).toBeNull();
  });

  it("should find one unexpired by email and organization", async () => {
    const doc = {
      _id: "invitation-1",
      email: "test@example.com",
      organizationId: "org-1",
      inviterId: "user-1",
      role: "member",
      createdAt: new Date(),
      expiresAt: new Date(),
    };
    mockInvitationModel.findOne.mockResolvedValue(doc);

    const result = await repository.findOneUnexpiredByEmailAndOrganization("test@example.com", "org-1");

    expect(result).toBeInstanceOf(Invitation);
    expect(mockInvitationModel.findOne).toHaveBeenCalledWith(expect.objectContaining({
      email: "test@example.com",
      organizationId: "org-1",
      status: "pending",
    }));
  });
});
