import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { describe, expect, it, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { getModelToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import request from "supertest";
import { BetterAuthHelper } from "../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../database/config";
import { EmailService } from "../../../email/email.service";
import { AuthModule } from "../../auth/auth.module";
import { AUTH } from "../../auth/auth.provider";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
import { UsersService } from "../../users/application/services/users.service";
import { UsersModule } from "../../users/users.module";
import { InvitationsRepository } from "../infrastructure/adapters/invitations.repository";
import { MembersRepository } from "../infrastructure/adapters/members.repository";
import { OrganizationsRepository } from "../infrastructure/adapters/organizations.repository";
import { OrganizationsModule } from "../organizations.module";
import { Model, Types } from "mongoose";
import { MemberRole } from "../domain/member-role.enum";
import { InvitationStatus } from "../domain/invitation-status.enum";
import {
  InvitationDoc,
  InvitationDoc as InvitationSchema,
} from "../infrastructure/schemas/invitation.schema";

describe("OrganizationsController", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  const betterAuthHelper = new BetterAuthHelper();
  let invitationModel: Model<InvitationSchema>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => ({
            ...generateMongoConfig(configService),
          }),
          inject: [EnvService],
        }),
        AuthModule,
        OrganizationsModule,
        UsersModule,
      ],
      providers: [
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

    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));
    invitationModel = moduleRef.get<Model<InvitationSchema>>(getModelToken(InvitationDoc.name));

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("should create organization", async () => {
    const { userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const slug = `test-create-${randomUUID()}`;

    const response = await request(app.getHttpServer())
      .post("/organizations")
      .set("Cookie", userCookie)
      .send({ name: "Test Organization", slug });

    expect(response.status).toEqual(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: "Test Organization",
        slug,
      }),
    );

    const organizationsRepository = moduleRef.get<OrganizationsRepository>(OrganizationsRepository);
    const membersRepository = moduleRef.get<MembersRepository>(MembersRepository);
    const org = await organizationsRepository.findOneById(response.body.id);
    expect(org).not.toBeNull();
    expect(org!.name).toEqual("Test Organization");
    const members = await membersRepository.findByOrganizationId(response.body.id);
    expect(members.length).toBeGreaterThanOrEqual(1);
  });

  it("should update organization if authorized", async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .patch(`/organizations/${org.id}`)
      .set("Cookie", userCookie)
      .send({ name: "Updated Organization", logo: "new-logo" });

    expect(response.status).toEqual(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: "Updated Organization",
      }),
    );

    const organizationsRepository = moduleRef.get<OrganizationsRepository>(OrganizationsRepository);
    const updatedOrg = await organizationsRepository.findOneById(org.id);
    expect(updatedOrg!.name).toEqual("Updated Organization");
  });

  it("should return invitation by id", async () => {
    const { user } = await betterAuthHelper.createUser({
      email: `invite-${randomUUID()}@example.com`,
    });
    const { userCookie } = await betterAuthHelper.getUserWithCookie(user.id);
    const {
      userCookie: cookieInviter,
      org: orgInviter,
      user: inviter,
    } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const invitationId = new Types.ObjectId().toHexString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invitationModel.create({
      _id: invitationId,
      email: user.email,
      organizationId: orgInviter.id,
      inviterId: inviter.id,
      role: MemberRole.MEMBER,
      status: InvitationStatus.PENDING,
      createdAt: new Date(),
      expiresAt,
    });

    const response = await request(app.getHttpServer())
      .get(`/organizations/invitations/${invitationId}`)
      .set("Cookie", userCookie)
      .send();

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      expiresAt: expiresAt.toISOString(),
      id: invitationId,
      inviter: {
        name: "First Last",
      },
      organization: {
        name: "My Organization",
      },
      organizationId: orgInviter.id,
      status: InvitationStatus.PENDING,
    });

    const failedResponse = await request(app.getHttpServer())
      .get(`/organizations/invitations/${invitationId}`)
      .set("Cookie", cookieInviter)
      .send();
    expect(failedResponse.status).toEqual(403);
  });

  it("should return 403 when updating organization without rights", async () => {
    const { org } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { userCookie: otherUserCookie } =
      await betterAuthHelper.createOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .patch(`/organizations/${org.id}`)
      .set("Cookie", otherUserCookie)
      .send({ name: "Updated", logo: "logo" });

    expect(response.status).toEqual(403);
  });

  it("should invite member if authorized", async () => {
    const { org, userCookie } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const inviteEmail = `invite-${randomUUID()}@example.com`;

    const response = await request(app.getHttpServer())
      .post(`/organizations/${org.id}/invite`)
      .set("Cookie", userCookie)
      .send({ email: inviteEmail, role: "member" });

    expect(response.status).toEqual(201);

    const invitationsRepository = moduleRef.get<InvitationsRepository>(InvitationsRepository);
    const invitation = await invitationsRepository.findOneUnexpiredByEmailAndOrganization(
      inviteEmail,
      org.id,
    );
    expect(invitation).not.toBeNull();
    expect(invitation!.email).toEqual(inviteEmail);
  });

  it("should return 403 when inviting without rights", async () => {
    const { org } = await betterAuthHelper.createOrganizationAndUserWithCookie();
    const { userCookie: otherUserCookie } =
      await betterAuthHelper.createOrganizationAndUserWithCookie();

    const response = await request(app.getHttpServer())
      .post(`/organizations/${org.id}/invite`)
      .set("Cookie", otherUserCookie)
      .send({ email: "invite@example.com", role: "member" });

    expect(response.status).toEqual(403);
  });
});
