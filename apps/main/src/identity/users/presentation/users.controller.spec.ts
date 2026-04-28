import { beforeAll, describe, expect, it, jest } from "@jest/globals";
import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "../application/services/users.service";
import { User } from "../domain/user";
import { UserRole } from "../domain/user-role.enum";
import { UsersController } from "./users.controller";
import { InvitationsRepository } from "../../organizations/infrastructure/adapters/invitations.repository";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { BetterAuthHelper, BetterAuthOrganization } from "../../../../test/better-auth-helper";
import type { INestApplication } from "@nestjs/common";
import { Invitation } from "../../organizations/domain/invitation";
import { MemberRole } from "../../organizations/domain/member-role.enum";
import { AuthModule } from "../../auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
import { EnvModule, EnvService } from "@open-dpp/env";
import { MongooseModule } from "@nestjs/mongoose";
import { generateMongoConfig } from "../../../database/config";
import { OrganizationsModule } from "../../organizations/organizations.module";
import { UsersModule } from "../users.module";
import type { Auth } from "better-auth";
import { AUTH } from "../../auth/auth.provider";
import { InvitationSchema } from "../../organizations/infrastructure/schemas/invitation.schema";
import { EmailService } from "../../../email/email.service";
import { InvitationStatus } from "../../organizations/domain/invitation-status.enum";
import { Types } from "mongoose";

describe("UsersController", () => {
  let app: INestApplication;

  let mockService: any;
  let mockInvitationRepository: any;
  const betterAuthHelper = new BetterAuthHelper();
  let user: { user: { id: string }; userEmail: string };
  let organization: BetterAuthOrganization;
  let module: TestingModule;

  beforeAll(async () => {
    mockService = {
      createUser: jest.fn(),
      findOne: jest.fn(),
      setUserRole: jest.fn(),
    };

    mockInvitationRepository = {
      findByEmail: jest.fn(),
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
        MongooseModule.forFeature([{ name: Invitation.name, schema: InvitationSchema }]),
        AuthModule,
        OrganizationsModule,
        UsersModule,
      ],
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockService },
        { provide: InvitationsRepository, useValue: mockInvitationRepository },
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
      ],
    })
      .overrideProvider(EmailService)
      .useValue({
        send: jest.fn(),
      })
      .compile();

    const userService = module.get<UsersService>(UsersService);
    betterAuthHelper.init(userService, module.get<Auth>(AUTH));

    app = module.createNestApplication();
    await app.init();
    user = await betterAuthHelper.createUser({ role: UserRole.ADMIN });
    organization = await betterAuthHelper.createOrganization(user.user.id);
  });

  it("should create user", async () => {
    const { userCookie } = await betterAuthHelper.getUserWithCookie(user.user.id);
    const dto = { email: "test@example.com", firstName: "John", lastName: "Doe" };
    const createdUser = { id: "1", ...dto };
    mockService.createUser.mockResolvedValue(createdUser);
    const response = await request(app.getHttpServer())
      .post("/users")
      .set("Cookie", userCookie)
      .send(dto);
    expect(response.status).toEqual(201);
    expect(mockService.createUser).toHaveBeenCalledWith(dto.email, dto.firstName, dto.lastName);
    expect(response.body).toEqual(createdUser);
  });

  it("should get invitations of current user", async () => {
    const emailToInvite = `invite.${randomUUID()}@example.com`;
    const invitation = Invitation.create({
      email: emailToInvite,
      organizationId: organization.id,
      role: MemberRole.MEMBER,
      inviterId: user.user.id,
      status: InvitationStatus.PENDING,
    });

    const invitation2 = Invitation.create({
      email: emailToInvite,
      organizationId: new Types.ObjectId().toHexString(),
      role: MemberRole.MEMBER,
      inviterId: user.user.id,
      status: InvitationStatus.DECLINED,
    });

    const invitedUser = await betterAuthHelper.createUser({
      role: UserRole.USER,
      email: emailToInvite,
    });
    const { userCookie: cookieOfInvitedUser } = await betterAuthHelper.getUserWithCookie(
      invitedUser.user.id,
    );
    mockInvitationRepository.findByEmail.mockResolvedValue([invitation, invitation2]);
    mockService.findOne.mockResolvedValue(user.user);
    const response = await request(app.getHttpServer())
      .get("/users/me/invitations?status=pending")
      .set("Cookie", cookieOfInvitedUser)
      .send();
    expect(response.status).toEqual(200);

    expect(response.body).toEqual([
      {
        id: invitation.id,
        expiresAt: invitation.expiresAt.toISOString(),
        organization: { name: "My Organization" },
        inviter: { name: "First Last" },
        status: InvitationStatus.PENDING,
      },
    ]);
  });

  it("should set user role", async () => {
    const newUser = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
    });

    const updatedUser = newUser.withRole(UserRole.ADMIN);
    mockService.setUserRole.mockResolvedValue(updatedUser);
    const { userCookie } = await betterAuthHelper.getUserWithCookie(user.user.id);

    const response = await request(app.getHttpServer())
      .patch(`/users/${newUser.id}/role`)
      .set("Cookie", userCookie)
      .send({ role: UserRole.ADMIN });
    expect(response.status).toEqual(200);
    expect(mockService.setUserRole).toHaveBeenCalledWith(newUser.id, UserRole.ADMIN);
    expect(response.body.role).toBe(UserRole.ADMIN);
  });

  afterAll(async () => {
    await module.close();
    await app.close();
  });
});
