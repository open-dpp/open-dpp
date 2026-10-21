import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { APP_GUARD } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { GuestAccessResponseDtoSchema } from "@open-dpp/dto";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ForbiddenExceptionFilter,
  NotFoundExceptionFilter,
  NotFoundInDatabaseExceptionFilter,
  ValueErrorFilter,
} from "@open-dpp/exception";
import request from "supertest";
import { BetterAuthHelper } from "../../../../test/better-auth-helper";
import { generateMongoConfig } from "../../../database/config";
import { BaseEmailTypes, type BaseEmail } from "../../../email/domain/base-email";
import { EmailService } from "../../../email/email.service";
import { AuthModule } from "../../auth/auth.module";
import { AUTH } from "../../auth/auth.provider";
import { AuthGuard } from "../../auth/infrastructure/guards/auth.guard";
import { ORGANIZATION_ID_HEADER } from "../../auth/presentation/decorators/organization-id.decorator";
import { Member } from "../../organizations/domain/member";
import { MemberRole } from "../../organizations/domain/member-role.enum";
import { MembersRepository } from "../../organizations/infrastructure/adapters/members.repository";
import { OrganizationsModule } from "../../organizations/organizations.module";
import { UsersService } from "../../users/application/services/users.service";
import { UsersModule } from "../../users/users.module";
import { GuestRole } from "../domain/guest-role.enum";
import { GuestAccessModule } from "../guest-access.module";

describe("GuestAccessController", () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let membersRepository: MembersRepository;
  const betterAuthHelper = new BetterAuthHelper();
  const sendMail = jest.fn<(mail: BaseEmail) => Promise<void>>();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        EventEmitterModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        AuthModule,
        OrganizationsModule,
        UsersModule,
        GuestAccessModule,
      ],
      providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
    })
      .overrideProvider(EmailService)
      .useValue({ send: sendMail })
      .compile();

    membersRepository = moduleRef.get(MembersRepository);
    betterAuthHelper.init(moduleRef.get<UsersService>(UsersService), moduleRef.get<Auth>(AUTH));

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(
      new NotFoundInDatabaseExceptionFilter(),
      new NotFoundExceptionFilter(),
      new ValueErrorFilter(),
      new ForbiddenExceptionFilter(),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createOwner() {
    return await betterAuthHelper.createOrganizationAndUserWithCookie();
  }

  function invite(
    cookie: string,
    organizationId: string,
    body: object = {
      kind: "Direct",
      email: `repairer-${randomUUID()}@example.com`,
      guestRole: GuestRole.REPAIRER,
    },
  ) {
    return request(app.getHttpServer())
      .post("/guest-accesses")
      .set("Cookie", cookie)
      .set(ORGANIZATION_ID_HEADER, organizationId)
      .send(body);
  }

  async function createAcceptedGuest(owner: Awaited<ReturnType<typeof createOwner>>) {
    const email = `guest-${randomUUID()}@example.com`;
    const invited = await invite(owner.userCookie, owner.org.id, {
      kind: "Direct",
      email,
      guestRole: GuestRole.REPAIRER,
    });
    const { user } = await betterAuthHelper.createUser({ email });
    const { userCookie } = await betterAuthHelper.getUserWithCookie(user.id);
    const accepted = await request(app.getHttpServer())
      .post(`/guest-accesses/${invited.body.id}/accept`)
      .set("Cookie", userCookie);
    return { id: invited.body.id as string, user, userCookie, accepted };
  }

  it("lets an owner invite a guest by email and sends the invitation mail", async () => {
    const owner = await createOwner();
    sendMail.mockClear();
    const email = `Repairer-${randomUUID()}@example.com`;

    const response = await invite(owner.userCookie, owner.org.id, {
      kind: "Direct",
      email,
      guestRole: GuestRole.REPAIRER,
    });

    expect(response.status).toEqual(201);
    expect(GuestAccessResponseDtoSchema.parse(response.body)).toEqual(
      expect.objectContaining({
        kind: "Direct",
        organizationId: owner.org.id,
        email: email.toLowerCase(),
        guestRole: GuestRole.REPAIRER,
        grantedBy: owner.user.id,
        status: "Pending",
      }),
    );
    expect(response.body).not.toHaveProperty("acceptedByUserId");
    const invitations = sendMail.mock.calls
      .map(([mail]) => mail)
      .filter((mail) => mail.type === BaseEmailTypes.InviteGuest);
    expect(invitations).toHaveLength(1);
    expect(invitations[0].to).toEqual(email.toLowerCase());
  });

  it("rejects invalid bodies", async () => {
    const owner = await createOwner();
    const valid = { kind: "Direct", email: "a@example.com", guestRole: GuestRole.REPAIRER };

    for (const body of [
      { ...valid, email: "no-email" },
      { ...valid, guestRole: "Member" },
      { ...valid, guestRole: [GuestRole.REPAIRER, GuestRole.RECYCLER] },
      { ...valid, kind: "Organization" },
      { kind: "Direct" },
    ]) {
      expect((await invite(owner.userCookie, owner.org.id, body)).status).toEqual(400);
    }
  });

  it("rejects a second invitation for the same email and an invitation of a member", async () => {
    const owner = await createOwner();
    const body = {
      kind: "Direct",
      email: `dup-${randomUUID()}@example.com`,
      guestRole: "Repairer",
    };
    expect((await invite(owner.userCookie, owner.org.id, body)).status).toEqual(201);
    expect((await invite(owner.userCookie, owner.org.id, body)).status).toEqual(400);

    const { user: member } = await betterAuthHelper.createUser();
    await membersRepository.save(
      Member.create({ organizationId: owner.org.id, userId: member.id, role: MemberRole.MEMBER }),
    );
    const response = await invite(owner.userCookie, owner.org.id, {
      ...body,
      email: member.email,
    });
    expect(response.status).toEqual(400);
  });

  it("rejects management by members who are not owners and by outsiders", async () => {
    const owner = await createOwner();
    const { user: member } = await betterAuthHelper.createUser();
    await membersRepository.save(
      Member.create({ organizationId: owner.org.id, userId: member.id, role: MemberRole.MEMBER }),
    );
    const memberCookie = (await betterAuthHelper.getUserWithCookie(member.id)).userCookie;
    const outsider = await createOwner();

    expect((await invite(memberCookie, owner.org.id)).status).toEqual(403);
    expect((await invite(outsider.userCookie, owner.org.id)).status).toEqual(403);
    const noHeader = await request(app.getHttpServer())
      .post("/guest-accesses")
      .set("Cookie", owner.userCookie)
      .send({ kind: "Direct", email: "a@example.com", guestRole: GuestRole.REPAIRER });
    // the role guard answers before the header is required
    expect(noHeader.status).toEqual(403);
    const noSession = await request(app.getHttpServer())
      .post("/guest-accesses")
      .set(ORGANIZATION_ID_HEADER, owner.org.id)
      .send({ kind: "Direct", email: "a@example.com", guestRole: GuestRole.REPAIRER });
    expect(noSession.status).toEqual(403);
  });

  it("lists the guest accesses of the organization only", async () => {
    const owner = await createOwner();
    const other = await createOwner();
    const mine = await invite(owner.userCookie, owner.org.id);
    await invite(other.userCookie, other.org.id);

    const response = await request(app.getHttpServer())
      .get("/guest-accesses")
      .set("Cookie", owner.userCookie)
      .set(ORGANIZATION_ID_HEADER, owner.org.id);

    expect(response.status).toEqual(200);
    expect(response.body.map((a: { id: string }) => a.id)).toEqual([mine.body.id]);
  });

  it("lets the invited person accept with a matching verified email", async () => {
    const owner = await createOwner();

    const { user, accepted } = await createAcceptedGuest(owner);

    expect(accepted.status).toEqual(201);
    expect(accepted.body).toEqual(
      expect.objectContaining({ status: "Accepted", acceptedByUserId: user.id }),
    );
  });

  it("rejects acceptance with another account and keeps the invitation pending", async () => {
    const owner = await createOwner();
    const invited = await invite(owner.userCookie, owner.org.id);
    const { user } = await betterAuthHelper.createUser();
    const { userCookie } = await betterAuthHelper.getUserWithCookie(user.id);

    const response = await request(app.getHttpServer())
      .post(`/guest-accesses/${invited.body.id}/accept`)
      .set("Cookie", userCookie);

    expect(response.status).toEqual(400);
    const list = await request(app.getHttpServer())
      .get("/guest-accesses")
      .set("Cookie", owner.userCookie)
      .set(ORGANIZATION_ID_HEADER, owner.org.id);
    expect(list.body[0].status).toEqual("Pending");
  });

  it("answers 404 for an unknown invitation and 403 without a session", async () => {
    const { userCookie } = await createOwner();

    expect(
      (
        await request(app.getHttpServer())
          .post(`/guest-accesses/${randomUUID()}/accept`)
          .set("Cookie", userCookie)
      ).status,
    ).toEqual(404);
    expect(
      (await request(app.getHttpServer()).post(`/guest-accesses/${randomUUID()}/accept`)).status,
    ).toEqual(403);
  });

  it("changes the role and revokes an access", async () => {
    const owner = await createOwner();
    const { id } = await createAcceptedGuest(owner);

    const changed = await request(app.getHttpServer())
      .patch(`/guest-accesses/${id}/role`)
      .set("Cookie", owner.userCookie)
      .set(ORGANIZATION_ID_HEADER, owner.org.id)
      .send({ guestRole: GuestRole.SUPPLIER });
    expect(changed.status).toEqual(200);
    expect(changed.body.guestRole).toEqual(GuestRole.SUPPLIER);

    const revoked = await request(app.getHttpServer())
      .post(`/guest-accesses/${id}/revoke`)
      .set("Cookie", owner.userCookie)
      .set(ORGANIZATION_ID_HEADER, owner.org.id);
    expect(revoked.status).toEqual(201);
    expect(revoked.body).toEqual(expect.objectContaining({ status: "Revoked" }));
    expect(revoked.body.revokedAt).toEqual(expect.any(String));
  });

  it("does not let an owner of another organization touch the access", async () => {
    const owner = await createOwner();
    const { id } = await createAcceptedGuest(owner);
    const other = await createOwner();

    const revoke = await request(app.getHttpServer())
      .post(`/guest-accesses/${id}/revoke`)
      .set("Cookie", other.userCookie)
      .set(ORGANIZATION_ID_HEADER, other.org.id);

    expect(revoke.status).toEqual(404);
  });

  it("denies a guest every management endpoint of the organization", async () => {
    const owner = await createOwner();
    const guest = await createAcceptedGuest(owner);
    const asGuest = (req: request.Test) =>
      req.set("Cookie", guest.userCookie).set(ORGANIZATION_ID_HEADER, owner.org.id);
    const server = app.getHttpServer();

    const responses = await Promise.all([
      asGuest(request(server).get("/guest-accesses")),
      asGuest(
        request(server)
          .post("/guest-accesses")
          .send({ kind: "Direct", email: "x@example.com", guestRole: "Repairer" }),
      ),
      asGuest(request(server).post(`/guest-accesses/${guest.id}/revoke`)),
      asGuest(
        request(server).patch(`/guest-accesses/${guest.id}/role`).send({ guestRole: "Supplier" }),
      ),
      asGuest(request(server).get(`/organizations/${owner.org.id}/members`)),
      asGuest(request(server).patch(`/organizations/${owner.org.id}`).send({ name: "Hijacked" })),
      asGuest(
        request(server)
          .post(`/organizations/${owner.org.id}/invite`)
          .send({ email: "y@example.com", role: "member" }),
      ),
    ]);

    expect(responses.map((r) => r.status)).toEqual(responses.map(() => 403));
  });
});
