import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { getConnectionToken, MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Connection } from "mongoose";
import { generateMongoConfig } from "../../../../database/config";
import { User } from "../../../users/domain/user";
import { DirectGuestAccess } from "../../domain/direct-guest-access";
import { GuestRole } from "../../domain/guest-role.enum";
import {
  GUEST_ACCESS_COLLECTION,
  GuestAccess as GuestAccessSchemaClass,
  GuestAccessSchema,
} from "../schemas/guest-access.schema";
import { GuestAccessRepository } from "./guest-access.repository";

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

  it("saves a pending access and finds it by id", async () => {
    const access = createAccess();

    const saved = await repository.save(access);
    const found = await repository.findOneById(access.id);

    expect(saved).toBeInstanceOf(DirectGuestAccess);
    expect(saved.toPlain()).toEqual(access.toPlain());
    expect(found?.toPlain()).toEqual(access.toPlain());
  });

  it("stores the schema version and the kind", async () => {
    const access = createAccess();
    await repository.save(access);

    const raw = await connection.collection<{ _id: string }>(GUEST_ACCESS_COLLECTION).findOne({
      _id: access.id,
    });

    expect(raw).toMatchObject({ _schemaVersion: "1.0.0", kind: "Direct", guestRole: "Repairer" });
    expect(raw).not.toHaveProperty("acceptedByUserId");
  });

  it("persists acceptance, a role change and revocation on update", async () => {
    const access = createAccess();
    await repository.save(access);

    const user = createUser();
    access.accept(user, new Date("2026-10-16T10:00:00.000Z"));
    access.changeGuestRole(GuestRole.SUPPLIER);
    await repository.save(access);
    const accepted = await repository.findOneByIdOrFail(access.id);
    expect(accepted.toPlain()).toEqual(access.toPlain());
    expect(accepted.isActiveFor({ userId: user.id })).toBe(true);

    access.revoke(new Date("2026-10-17T10:00:00.000Z"));
    await repository.save(access);
    const revoked = await repository.findOneByIdOrFail(access.id);
    expect(revoked.isActiveFor({ userId: user.id })).toBe(false);
    expect(await connection.collection(GUEST_ACCESS_COLLECTION).countDocuments()).toBe(1);
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
