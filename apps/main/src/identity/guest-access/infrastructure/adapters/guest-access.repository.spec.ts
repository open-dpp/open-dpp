import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import {
  ConcurrentModificationError,
  NotFoundInDatabaseException,
  ValueError,
} from "@open-dpp/exception";
import { Connection } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { User } from "../../../users/domain/user";
import { DirectGuestAccess } from "../../domain/direct-guest-access";
import { GuestAccessStatus } from "../../domain/guest-access-kind.enum";
import { GuestRole } from "../../domain/guest-role.enum";
import { GuestAccessMapper } from "../mappers/guest-access.mapper";
import {
  GUEST_ACCESS_COLLECTION,
  GuestAccess as GuestAccessSchemaClass,
  GuestAccessSchema,
} from "../schemas/guest-access.schema";
import {
  GUEST_ACCESS_ALREADY_EXISTS,
  GUEST_ACCESS_CHANGED_MESSAGE,
  GuestAccessRepository,
} from "./guest-access.repository";

describe("GuestAccessRepository", () => {
  let module: TestingModule;
  let repository: GuestAccessRepository;
  let connection: Connection;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        MongooseModule.forFeature([
          { name: GuestAccessSchemaClass.name, schema: GuestAccessSchema },
        ]),
      ],
      providers: [GuestAccessRepository],
    }).compile();

    repository = module.get(GuestAccessRepository);
    connection = module.get(getConnectionToken());
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await connection.collection(GUEST_ACCESS_COLLECTION).deleteMany({});
  });

  function createAccess(
    overrides: Partial<{ organizationId: string; email: string; createdAt: Date }> = {},
  ) {
    return DirectGuestAccess.create({
      organizationId: overrides.organizationId ?? "org-1",
      email: overrides.email ?? "repairer@example.com",
      guestRole: GuestRole.REPAIRER,
      grantedBy: "owner-1",
      now: overrides.createdAt,
    });
  }

  function createUser(email = "repairer@example.com") {
    return User.create({ email, firstName: "Rita", lastName: "Repair", emailVerified: true });
  }

  it("creates the indexes for the owner's list and for authorization", async () => {
    await connection.model(GuestAccessSchemaClass.name).syncIndexes();

    const indexes = await connection.collection(GUEST_ACCESS_COLLECTION).indexes();

    expect(indexes.map((i) => i.key)).toEqual([
      { _id: 1 },
      { organizationId: 1, email: 1, revokedAt: 1 },
      { acceptedByUserId: 1, organizationId: 1 },
    ]);
    const uniqueIndex = indexes.find((i) => "email" in i.key);
    expect(uniqueIndex?.unique).toBe(true);
    expect(uniqueIndex?.partialFilterExpression).toEqual({ email: { $exists: true } });
    const userIndex = indexes.find((i) => "acceptedByUserId" in i.key);
    expect(userIndex?.partialFilterExpression).toEqual({ acceptedByUserId: { $exists: true } });
  });

  describe("one live access per organization and email", () => {
    beforeEach(async () => {
      await connection.model(GuestAccessSchemaClass.name).syncIndexes();
    });

    it("rejects a second live access, also when two are saved at the same time", async () => {
      const results = await Promise.allSettled([
        repository.save(createAccess()),
        repository.save(createAccess()),
      ]);

      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      const rejected = results.find((r) => r.status === "rejected");
      expect(rejected).toMatchObject({ reason: expect.any(ValueError) });
      expect(rejected).toMatchObject({ reason: { message: GUEST_ACCESS_ALREADY_EXISTS } });
      expect(await repository.findAllByOrganizationId("org-1")).toHaveLength(1);
    });

    it("allows the same email in another organization", async () => {
      await repository.save(createAccess({ organizationId: "org-1" }));

      await expect(
        repository.save(createAccess({ organizationId: "org-2" })),
      ).resolves.toBeDefined();
    });

    it("allows to revoke and invite the same email again, any number of times", async () => {
      for (let round = 1; round <= 3; round++) {
        const access = await repository.save(createAccess());
        access.revoke(new Date(`2026-10-0${round}T10:00:00.000Z`));
        await repository.save(access);
      }
      await repository.save(createAccess());

      const all = await repository.findAllByOrganizationId("org-1");
      expect(all).toHaveLength(4);
      expect(await repository.findAllByOrganizationId("org-1", { revoked: false })).toHaveLength(1);
    });

    it("rejects a second live access for an email whose first access was only changed", async () => {
      const first = await repository.save(createAccess());
      first.changeGuestRole(GuestRole.RECYCLER);
      await repository.save(first);

      await expect(repository.save(createAccess())).rejects.toBeInstanceOf(ValueError);
    });
  });

  it("saves a pending access and finds it by id", async () => {
    const access = createAccess();

    const saved = await repository.save(access);
    const found = await repository.findOneById(access.id);

    expect(saved).toBeInstanceOf(DirectGuestAccess);
    expect(saved.toPlain()).toEqual({ ...access.toPlain(), revision: 0 });
    expect(found?.toPlain()).toEqual({ ...access.toPlain(), revision: 0 });
  });

  it("stores the schema version and the kind", async () => {
    const access = createAccess();
    await repository.save(access);

    const raw = await connection.collection<{ _id: string }>(GUEST_ACCESS_COLLECTION).findOne({
      _id: access.id,
    });

    expect(raw).toMatchObject({
      _schemaVersion: "1.0.0",
      kind: "Direct",
      guestRole: "Repairer",
      revision: 0,
    });
    expect(raw).not.toHaveProperty("acceptedByUserId");
    expect(raw).not.toHaveProperty("__v");
  });

  it("persists acceptance, a role change and revocation on update", async () => {
    const access = await repository.save(createAccess());

    const user = createUser();
    access.accept(user, new Date("2026-10-16T10:00:00.000Z"));
    access.changeGuestRole(GuestRole.SUPPLIER);
    const savedAccepted = await repository.save(access);
    const accepted = await repository.findOneByIdOrFail(access.id);
    expect(accepted.toPlain()).toEqual({ ...access.toPlain(), revision: 1 });
    expect(savedAccepted.toPlain()).toEqual(accepted.toPlain());
    expect(accepted.isActiveFor({ userId: user.id })).toBe(true);

    savedAccepted.revoke(new Date("2026-10-17T10:00:00.000Z"));
    await repository.save(savedAccepted);
    const revoked = await repository.findOneByIdOrFail(access.id);
    expect(revoked.isActiveFor({ userId: user.id })).toBe(false);
    expect(await connection.collection(GUEST_ACCESS_COLLECTION).countDocuments()).toBe(1);
  });

  describe("concurrent changes", () => {
    it("counts the saves of an access", async () => {
      const inserted = await repository.save(createAccess());
      inserted.changeGuestRole(GuestRole.SUPPLIER);
      const replaced = await repository.save(inserted);
      replaced.changeGuestRole(GuestRole.RECYCLER);
      const replacedAgain = await repository.save(replaced);

      expect([inserted.revision, replaced.revision, replacedAgain.revision]).toEqual([0, 1, 2]);
      expect((await repository.findOneByIdOrFail(inserted.id)).revision).toBe(2);
    });

    it("does not bring back an access which was revoked after it was read", async () => {
      const saved = await repository.save(createAccess());
      const readByGuest = await repository.findOneByIdOrFail(saved.id);
      const readByOwner = await repository.findOneByIdOrFail(saved.id);
      readByOwner.revoke(new Date("2026-10-17T10:00:00.000Z"));
      await repository.save(readByOwner);

      const guest = createUser();
      readByGuest.accept(guest, new Date("2026-10-17T10:00:01.000Z"));
      const lateAccept = repository.save(readByGuest);

      await expect(lateAccept).rejects.toBeInstanceOf(ConcurrentModificationError);
      await expect(lateAccept).rejects.toMatchObject({ message: GUEST_ACCESS_CHANGED_MESSAGE });
      const stored = await repository.findOneByIdOrFail(saved.id);
      expect(stored.revokedAt).toEqual(new Date("2026-10-17T10:00:00.000Z"));
      expect(stored.revision).toBe(1);
      expect(stored.status).toBe(GuestAccessStatus.REVOKED);
      expect(stored.isActiveFor({ userId: guest.id })).toBe(false);
    });

    it("does not undo a role change with a late acceptance", async () => {
      const saved = await repository.save(createAccess());
      const readByGuest = await repository.findOneByIdOrFail(saved.id);
      const readByOwner = await repository.findOneByIdOrFail(saved.id);
      readByOwner.changeGuestRole(GuestRole.SUPPLIER);
      await repository.save(readByOwner);

      readByGuest.accept(createUser(), new Date());

      await expect(repository.save(readByGuest)).rejects.toBeInstanceOf(
        ConcurrentModificationError,
      );
      expect((await repository.findOneByIdOrFail(saved.id)).guestRole).toBe(GuestRole.SUPPLIER);
    });

    it("lets only one of two saves of the same revision win", async () => {
      const saved = await repository.save(createAccess());
      const first = await repository.findOneByIdOrFail(saved.id);
      const second = await repository.findOneByIdOrFail(saved.id);
      first.changeGuestRole(GuestRole.SUPPLIER);
      second.changeGuestRole(GuestRole.RECYCLER);

      const results = await Promise.allSettled([repository.save(first), repository.save(second)]);

      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(results.find((r) => r.status === "rejected")).toMatchObject({
        reason: expect.any(ConcurrentModificationError),
      });
    });

    it("rejects a save of an access which is no longer stored", async () => {
      const saved = await repository.save(createAccess());
      await connection.collection(GUEST_ACCESS_COLLECTION).deleteMany({});
      saved.changeGuestRole(GuestRole.SUPPLIER);

      await expect(repository.save(saved)).rejects.toBeInstanceOf(ConcurrentModificationError);
    });

    it("reads an access stored without a revision as revision 0", async () => {
      const access = createAccess();
      // like a document written by hand: only the fields which are set, and no revision
      const stored = Object.fromEntries(
        Object.entries(GuestAccessMapper.toPersistence(access)).filter(
          ([key, value]) => value !== undefined && key !== "revision",
        ),
      ) as { _id: string };
      await connection.collection<{ _id: string }>(GUEST_ACCESS_COLLECTION).insertOne(stored);

      expect((await repository.findOneByIdOrFail(access.id)).revision).toBe(0);
    });
  });

  it("returns null or throws for an unknown id", async () => {
    expect(await repository.findOneById("missing")).toBeNull();
    await expect(repository.findOneByIdOrFail("missing")).rejects.toThrow(
      NotFoundInDatabaseException,
    );
  });

  it("lists all accesses of an organization, oldest first, including revoked ones", async () => {
    const second = createAccess({
      email: "b@example.com",
      createdAt: new Date("2026-10-02T00:00:00.000Z"),
    });
    const first = createAccess({
      email: "a@example.com",
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
    });
    first.revoke(new Date("2026-10-03T00:00:00.000Z"));
    await repository.save(second);
    await repository.save(first);
    await repository.save(createAccess({ organizationId: "org-2" }));

    const found = await repository.findAllByOrganizationId("org-1");

    expect(found.map((a) => a.id)).toEqual([first.id, second.id]);
  });

  it("filters by the user that accepted and by not being revoked", async () => {
    const user = createUser();
    const accepted = createAccess();
    accepted.accept(user, new Date());
    const revoked = createAccess({ email: "other@example.com" });
    revoked.accept(createUser("other@example.com"), new Date());
    revoked.revoke(new Date());
    const pending = createAccess({ email: "pending@example.com" });
    const otherOrganization = createAccess({ organizationId: "org-2" });
    otherOrganization.accept(user, new Date());
    for (const access of [accepted, revoked, pending, otherOrganization]) {
      await repository.save(access);
    }

    const found = await repository.findAllByOrganizationId("org-1", {
      acceptedByUserId: user.id,
      revoked: false,
    });

    expect(found.map((a) => a.id)).toEqual([accepted.id]);
    expect(
      await repository.findAllByOrganizationId("org-1", {
        acceptedByUserId: "someone",
        revoked: false,
      }),
    ).toEqual([]);
  });

  it("filters by email regardless of casing and by revoked state", async () => {
    const pending = createAccess({
      email: "repairer@example.com",
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
    });
    const revoked = createAccess({
      email: "repairer@example.com",
      createdAt: new Date("2026-10-02T00:00:00.000Z"),
    });
    revoked.revoke(new Date());
    const otherEmail = createAccess({ email: "other@example.com" });
    const otherOrganization = createAccess({ organizationId: "org-2" });
    for (const access of [pending, revoked, otherEmail, otherOrganization]) {
      await repository.save(access);
    }
    const email = " Repairer@Example.com ";

    const ids = async (filter: { revoked?: boolean }) =>
      (await repository.findAllByOrganizationId("org-1", { email, ...filter })).map((a) => a.id);

    expect(await ids({ revoked: false })).toEqual([pending.id]);
    expect(await ids({ revoked: true })).toEqual([revoked.id]);
    expect(await ids({})).toEqual([pending.id, revoked.id]);
  });

  it("rejects operator-shaped input with a cast error instead of using it as a query operator", async () => {
    await repository.save(createAccess());
    const operator = { $ne: "x" };

    // @ts-expect-error an operator object is not a valid id
    await expect(repository.findOneById(operator)).rejects.toThrow();
    // @ts-expect-error an operator object is not a valid organization id
    await expect(repository.findAllByOrganizationId(operator)).rejects.toThrow();
    // @ts-expect-error an operator object is not a valid user id
    const byUser = repository.findAllByOrganizationId("org-1", { acceptedByUserId: operator });
    await expect(byUser).rejects.toThrow();
    // @ts-expect-error an operator object is not a valid email
    const byEmail = repository.findAllByOrganizationId("org-1", { email: operator });
    await expect(byEmail).rejects.toThrow();
  });
});
