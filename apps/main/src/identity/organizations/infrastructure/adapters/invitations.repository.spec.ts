import { describe, expect, it, jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Model, Types } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { AUTH } from "../../../auth/auth.provider";
import { Invitation } from "../../domain/invitation";
import { InvitationStatus } from "../../domain/invitation-status.enum";
import { MemberRole } from "../../domain/member-role.enum";
import {
  Invitation as InvitationSchema,
  InvitationSchema as InvitationSchemaDefinition,
} from "../schemas/invitation.schema";
import { InvitationsRepository } from "./invitations.repository";

describe("InvitationsRepository", () => {
  let repository: InvitationsRepository;
  let invitationModel: Model<InvitationSchema>;
  let mockAuth: any;
  let module: TestingModule;

  beforeAll(async () => {
    mockAuth = {
      api: {
        createInvitation: jest.fn(),
      },
    };

    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          {
            name: InvitationSchema.name,
            schema: InvitationSchemaDefinition,
          },
        ]),
      ],
      providers: [
        InvitationsRepository,
        {
          provide: AUTH,
          useValue: mockAuth,
        },
      ],
    }).compile();

    repository = module.get<InvitationsRepository>(InvitationsRepository);
    invitationModel = module.get<Model<InvitationSchema>>(
      `${InvitationSchema.name}Model`,
    );
  });

  afterAll(async () => {
    await module.close();
  });

  it("should find one by id", async () => {
    const id = new Types.ObjectId().toHexString();
    await invitationModel.create({
      _id: id,
      email: "test@example.com",
      organizationId: new Types.ObjectId().toHexString(),
      inviterId: new Types.ObjectId().toHexString(),
      role: MemberRole.MEMBER,
      status: InvitationStatus.PENDING,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const result = await repository.findOneById(id);

    expect(result).toBeInstanceOf(Invitation);
    expect(result?.id).toBe(id);
    expect(result?.email).toBe("test@example.com");
  });

  it("should return null if not found by id", async () => {
    const result = await repository.findOneById("non-existent-id");

    expect(result).toBeNull();
  });

  it("should find one unexpired by email and organization", async () => {
    const email = "unexpired@example.com";
    const organizationId = new Types.ObjectId().toHexString();

    await invitationModel.create({
      _id: new Types.ObjectId().toHexString(),
      email,
      organizationId,
      inviterId: new Types.ObjectId().toHexString(),
      role: MemberRole.MEMBER,
      status: InvitationStatus.PENDING,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const result = await repository.findOneUnexpiredByEmailAndOrganization(email, organizationId);

    expect(result).toBeInstanceOf(Invitation);
    expect(result?.email).toBe(email);
    expect(result?.organizationId).toBe(organizationId);
    expect(result?.status).toBe(InvitationStatus.PENDING);
  });

  it("should not find expired invitations", async () => {
    const email = "expired@example.com";
    const organizationId = new Types.ObjectId().toHexString();

    await invitationModel.create({
      _id: new Types.ObjectId().toHexString(),
      email,
      organizationId,
      inviterId: new Types.ObjectId().toHexString(),
      role: MemberRole.MEMBER,
      status: InvitationStatus.PENDING,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    });

    const result = await repository.findOneUnexpiredByEmailAndOrganization(email, organizationId);

    expect(result).toBeNull();
  });

  it("should not find accepted invitations", async () => {
    const email = "accepted@example.com";
    const organizationId = new Types.ObjectId().toHexString();

    await invitationModel.create({
      _id: new Types.ObjectId().toHexString(),
      email,
      organizationId,
      inviterId: new Types.ObjectId().toHexString(),
      role: MemberRole.MEMBER,
      status: InvitationStatus.ACCEPTED,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const result = await repository.findOneUnexpiredByEmailAndOrganization(email, organizationId);

    expect(result).toBeNull();
  });

  it("should save an invitation via BetterAuth API", async () => {
    const invitation = Invitation.create({
      email: "invite@example.com",
      inviterId: "user-1",
      organizationId: "org-1",
      role: MemberRole.MEMBER,
    });
    const headers = { authorization: "Bearer token" };

    mockAuth.api.createInvitation.mockResolvedValue({});

    await repository.save(invitation, headers);

    expect(mockAuth.api.createInvitation).toHaveBeenCalledWith({
      headers,
      body: {
        email: "invite@example.com",
        role: MemberRole.MEMBER,
        organizationId: "org-1",
      },
    });
  });
});
