import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException, Logger } from "@nestjs/common";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException, ValueError } from "@open-dpp/exception";
import { Connection } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { InviteGuestMail } from "../../../../email/domain/invite-guest-mail";
import { EmailService } from "../../../../email/email.service";
import { MembersService } from "../../../organizations/application/services/members.service";
import { OrganizationsRepository } from "../../../organizations/infrastructure/adapters/organizations.repository";
import { DisplayLanguage, DisplayLanguageType } from "@open-dpp/dto";
import { User } from "../../../users/domain/user";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { UserRole } from "../../../users/domain/user-role.enum";
import { GuestAccessStatus } from "../../domain/guest-access-kind.enum";
import { GuestRole } from "../../domain/guest-role.enum";
import { GuestAccessRepository } from "../../infrastructure/adapters/guest-access.repository";
import {
  GUEST_ACCESS_COLLECTION,
  GuestAccess as GuestAccessSchemaClass,
  GuestAccessSchema,
} from "../../infrastructure/schemas/guest-access.schema";
import { GuestAccessService } from "./guest-access.service";

describe("GuestAccessService", () => {
  let module: TestingModule;
  let service: GuestAccessService;
  let repository: GuestAccessRepository;
  let owners: Set<string>;
  let members: { user: { email: string } | null }[];
  let memberOfOrganization: Set<string>;
  let sentMails: InviteGuestMail[];
  let inviterLanguage: DisplayLanguageType | undefined;
  let sendMail: jest.Mock<(mail: InviteGuestMail) => Promise<void>>;

  const organizationId = "org-1";
  const ownerId = "owner-1";

  function createUser(email = "repairer@example.com", emailVerified = true) {
    return User.create({ email, firstName: "Rita", lastName: "Repair", emailVerified });
  }

  // the same account with another verified email, e.g. after the user changed their email
  function createUserWithId(id: string, email: string) {
    const now = new Date();
    return User.loadFromDb({
      id,
      email,
      firstName: "Rita",
      lastName: "Repair",
      emailVerified: true,
      role: UserRole.USER,
      preferredLanguage: DisplayLanguage.en,
      createdAt: now,
      updatedAt: now,
    });
  }

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    owners = new Set([ownerId]);
    members = [];
    memberOfOrganization = new Set();
    sentMails = [];
    inviterLanguage = undefined;
    sendMail = jest.fn(async (mail: InviteGuestMail) => {
      sentMails.push(mail);
    });

    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (env: EnvService) => generateMongoConfig(env),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: GuestAccessSchemaClass.name, schema: GuestAccessSchema },
        ]),
      ],
      providers: [
        GuestAccessService,
        GuestAccessRepository,
        {
          provide: MembersService,
          useValue: {
            isOwnerOrAdmin: async (_organizationId: string, userId: string) => owners.has(userId),
            getMembers: async () => members,
            isMemberOfOrganization: async (userId: string) => memberOfOrganization.has(userId),
          },
        },
        {
          provide: OrganizationsRepository,
          useValue: { findOneById: async () => ({ id: organizationId, name: "ACME GmbH" }) },
        },
        {
          provide: UsersRepository,
          useValue: {
            findOneById: async (id: string) =>
              inviterLanguage ? { id, preferredLanguage: inviterLanguage } : null,
          },
        },
        { provide: EmailService, useValue: { send: sendMail } },
      ],
    }).compile();

    service = module.get(GuestAccessService);
    repository = module.get(GuestAccessRepository);
    await module
      .get<Connection>(getConnectionToken())
      .collection(GUEST_ACCESS_COLLECTION)
      .deleteMany({});
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await module.close();
  });

  describe("invite", () => {
    it("creates a pending access and sends the invitation mail", async () => {
      const access = await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: " Repairer@Example.com ",
        guestRole: GuestRole.REPAIRER,
      });

      expect(access.status).toEqual(GuestAccessStatus.PENDING);
      expect(access.grantedBy).toEqual(ownerId);
      expect(access.guestRole).toEqual(GuestRole.REPAIRER);
      expect((await repository.findOneByIdOrFail(access.id)).toPlain()).toEqual(access.toPlain());
      expect(sentMails).toHaveLength(1);
      expect(sentMails[0].to).toEqual("repairer@example.com");
      expect(sentMails[0].templateProperties).toMatchObject({
        organizationName: "ACME GmbH",
        guestRoleName: "Repairer",
        link: expect.stringContaining(`/accept-guest-access/${access.id}`),
      });
    });

    it("sends the English mail by default and the German one to a German-speaking owner", async () => {
      await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: "authority@example.com",
        guestRole: GuestRole.MARKET_SURVEILLANCE,
      });
      inviterLanguage = DisplayLanguage.de;
      await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: "authority-de@example.com",
        guestRole: GuestRole.MARKET_SURVEILLANCE,
      });

      const [english, german] = sentMails;
      expect(english.language).toEqual("en");
      expect(english.subject).toEqual("Invitation to access product passport data");
      expect(english.templateProperties).toMatchObject({
        guestRoleName: "Market surveillance authority",
      });
      expect(german.language).toEqual("de");
      expect(german.subject).toEqual("Einladung zum Zugriff auf Produktpassdaten");
      expect(german.templateProperties).toMatchObject({
        guestRoleName: "Marktüberwachungsbehörde",
      });
    });

    it("rejects an invitation from someone who is not an owner", async () => {
      await expect(
        service.invite({
          organizationId,
          actingUserId: "someone",
          email: "repairer@example.com",
          guestRole: GuestRole.REPAIRER,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it("rejects an email that belongs to a member of the organization", async () => {
      members = [{ user: { email: "Repairer@example.com" } }, { user: null }];

      await expect(
        service.invite({
          organizationId,
          actingUserId: ownerId,
          email: "repairer@example.com",
          guestRole: GuestRole.REPAIRER,
        }),
      ).rejects.toThrow(ValueError);
    });

    it("rejects a second invitation while the first is not revoked, but allows one after revocation", async () => {
      const invite = () =>
        service.invite({
          organizationId,
          actingUserId: ownerId,
          email: "repairer@example.com",
          guestRole: GuestRole.REPAIRER,
        });
      const first = await invite();

      await expect(invite()).rejects.toThrow(ValueError);

      await service.revoke({ organizationId, guestAccessId: first.id, actingUserId: ownerId });
      const second = await invite();
      expect(second.id).not.toEqual(first.id);
    });

    it("keeps the pending access when the mail cannot be sent", async () => {
      sendMail.mockRejectedValueOnce(new Error("smtp down"));

      const access = await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: "repairer@example.com",
        guestRole: GuestRole.REPAIRER,
      });

      expect((await repository.findOneByIdOrFail(access.id)).status).toEqual(
        GuestAccessStatus.PENDING,
      );
    });
  });

  describe("list", () => {
    it("returns all accesses of the organization for owners only", async () => {
      const invited = await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: "repairer@example.com",
        guestRole: GuestRole.REPAIRER,
      });

      expect((await service.list(organizationId, ownerId)).map((a) => a.id)).toEqual([invited.id]);
      expect(await service.list("org-2", ownerId)).toEqual([]);
      await expect(service.list(organizationId, "someone")).rejects.toThrow(ForbiddenException);
    });
  });

  describe("accept", () => {
    async function invitePending(email = "repairer@example.com") {
      return await service.invite({
        organizationId,
        actingUserId: ownerId,
        email,
        guestRole: GuestRole.REPAIRER,
      });
    }

    it("binds the access to the accepting user", async () => {
      const pending = await invitePending();
      const user = createUser();

      const accepted = await service.accept(pending.id, user);

      expect(accepted.status).toEqual(GuestAccessStatus.ACCEPTED);
      expect(accepted.isActiveFor({ userId: user.id })).toBe(true);
      expect(await service.findGuestRole(user.id, organizationId)).toEqual(GuestRole.REPAIRER);
    });

    it("rejects another or an unverified email and keeps the invitation pending", async () => {
      const pending = await invitePending();

      await expect(service.accept(pending.id, createUser("other@example.com"))).rejects.toThrow(
        ValueError,
      );
      await expect(
        service.accept(pending.id, createUser("repairer@example.com", false)),
      ).rejects.toThrow(ValueError);
      expect((await repository.findOneByIdOrFail(pending.id)).status).toEqual(
        GuestAccessStatus.PENDING,
      );
    });

    it("rejects acceptance after revocation and for unknown invitations", async () => {
      const pending = await invitePending();
      await service.revoke({ organizationId, guestAccessId: pending.id, actingUserId: ownerId });

      await expect(service.accept(pending.id, createUser())).rejects.toThrow(ValueError);
      await expect(service.accept("missing", createUser())).rejects.toThrow(
        NotFoundInDatabaseException,
      );
    });

    it("rejects members of the organization", async () => {
      const pending = await invitePending();
      const user = createUser();
      memberOfOrganization.add(user.id);

      await expect(service.accept(pending.id, user)).rejects.toThrow(ValueError);
    });

    it("keeps one active guest access per user and organization", async () => {
      const first = await invitePending();
      const user = createUser();
      await service.accept(first.id, user);
      const second = await invitePending("repairer+second@example.com");

      await expect(
        service.accept(second.id, createUserWithId(user.id, "repairer+second@example.com")),
      ).rejects.toThrow(ValueError);
      expect((await repository.findOneByIdOrFail(second.id)).status).toEqual(
        GuestAccessStatus.PENDING,
      );
    });
  });

  describe("changeGuestRole and revoke", () => {
    it("changes the role of an access of the organization", async () => {
      const pending = await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: "repairer@example.com",
        guestRole: GuestRole.REPAIRER,
      });

      const changed = await service.changeGuestRole({
        organizationId,
        guestAccessId: pending.id,
        actingUserId: ownerId,
        guestRole: GuestRole.SUPPLIER,
      });

      expect(changed.guestRole).toEqual(GuestRole.SUPPLIER);
      expect((await repository.findOneByIdOrFail(pending.id)).guestRole).toEqual(
        GuestRole.SUPPLIER,
      );
    });

    it("ends access immediately on revocation", async () => {
      const pending = await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: "repairer@example.com",
        guestRole: GuestRole.REPAIRER,
      });
      const user = createUser();
      await service.accept(pending.id, user);

      const revoked = await service.revoke({
        organizationId,
        guestAccessId: pending.id,
        actingUserId: ownerId,
      });

      expect(revoked.status).toEqual(GuestAccessStatus.REVOKED);
      expect(await service.findGuestRole(user.id, organizationId)).toBeUndefined();
    });

    it("only lets owners of the same organization change or revoke an access", async () => {
      const pending = await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: "repairer@example.com",
        guestRole: GuestRole.REPAIRER,
      });
      owners.add("owner-of-org-2");

      await expect(
        service.revoke({ organizationId, guestAccessId: pending.id, actingUserId: "someone" }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.revoke({
          organizationId: "org-2",
          guestAccessId: pending.id,
          actingUserId: "owner-of-org-2",
        }),
      ).rejects.toThrow(NotFoundInDatabaseException);
      await expect(
        service.changeGuestRole({
          organizationId: "org-2",
          guestAccessId: pending.id,
          actingUserId: "owner-of-org-2",
          guestRole: GuestRole.SUPPLIER,
        }),
      ).rejects.toThrow(NotFoundInDatabaseException);
      expect((await repository.findOneByIdOrFail(pending.id)).status).toEqual(
        GuestAccessStatus.PENDING,
      );
    });
  });

  describe("findGuestRole", () => {
    it("returns nothing for pending accesses and other organizations", async () => {
      const user = createUser();
      const pending = await service.invite({
        organizationId,
        actingUserId: ownerId,
        email: user.email,
        guestRole: GuestRole.REPAIRER,
      });

      expect(await service.findGuestRole(user.id, organizationId)).toBeUndefined();

      await service.accept(pending.id, user);
      expect(await service.findGuestRole(user.id, organizationId)).toEqual(GuestRole.REPAIRER);
      expect(await service.findGuestRole(user.id, "org-2")).toBeUndefined();
    });
  });
});
