import type { INestApplication } from "@nestjs/common";
import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { MongooseModule } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvModule, EnvService } from "@open-dpp/env";
import { Language } from "@open-dpp/dto";
import { ObjectId } from "mongodb";
import { generateMongoConfig } from "../../../../database/config";
import { EmailService } from "../../../../email/email.service";
import { AuthModule } from "../../../auth/auth.module";
import { AUTH } from "../../../auth/auth.provider";
import { User } from "../../domain/user";
import { UserRole } from "../../domain/user-role.enum";
import { UsersModule } from "../../users.module";
import { UsersRepository } from "./users.repository";

describe("UsersRepository", () => {
  let module: TestingModule;
  let app: INestApplication;
  let repository: UsersRepository;
  let auth: Auth;

  async function seedUser(overrides?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    password?: string;
  }): Promise<User> {
    const email = overrides?.email ?? `${randomUUID()}@test.test`;
    const user = User.create({
      email,
      firstName: overrides?.firstName ?? "John",
      lastName: overrides?.lastName ?? "Doe",
      role: UserRole.USER,
    });
    const saved = await repository.save(user, overrides?.password ?? "test-password-1234");
    if (!saved) {
      throw new Error(`Failed to seed user with email ${email}`);
    }
    return saved;
  }

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        EnvModule.forRoot(),
        MongooseModule.forRootAsync({
          imports: [EnvModule],
          useFactory: (configService: EnvService) => generateMongoConfig(configService),
          inject: [EnvService],
        }),
        AuthModule,
        UsersModule,
      ],
    })
      .overrideProvider(EmailService)
      .useValue({ send: jest.fn() })
      .compile();

    app = module.createNestApplication();
    await app.init();

    repository = module.get<UsersRepository>(UsersRepository);
    auth = module.get<Auth>(AUTH);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe("save", () => {
    it("persists a user and makes it retrievable by email", async () => {
      const email = `${randomUUID()}@test.test`;
      const user = User.create({
        email,
        firstName: "Alice",
        lastName: "Smith",
        role: UserRole.USER,
      });

      const saved = await repository.save(user);

      expect(saved).toBeInstanceOf(User);
      expect(saved!.email).toBe(email);
      expect(saved!.firstName).toBe("Alice");
      expect(saved!.lastName).toBe("Smith");
      expect(saved!.name).toBe("Alice Smith");
      expect(saved!.role).toBe(UserRole.USER);
      expect(ObjectId.isValid(saved!.id)).toBe(true);

      const found = await repository.findOneByEmail(email);
      expect(found).toBeInstanceOf(User);
      expect(found!.id).toBe(saved!.id);
    });

    it("allows sign-in with the provided password", async () => {
      const email = `${randomUUID()}@test.test`;
      const password = "secure-password-1234";
      const user = User.create({
        email,
        firstName: "Bob",
        lastName: "Jones",
        role: UserRole.USER,
      });

      const saved = await repository.save(user, password);
      expect(saved).not.toBeNull();

      const signIn = await auth.api.signInEmail({
        body: { email, password },
      });

      expect(signIn).toBeDefined();
      expect(signIn.user.email).toBe(email);
    });
  });

  describe("findOneById", () => {
    it("returns the user by id", async () => {
      const seeded = await seedUser();
      const found = await repository.findOneById(seeded.id);

      expect(found).toBeInstanceOf(User);
      expect(found!.id).toBe(seeded.id);
      expect(found!.email).toBe(seeded.email);
    });

    it("returns null for an invalid ObjectId", async () => {
      const result = await repository.findOneById("invalid-id");
      expect(result).toBeNull();
    });

    it("returns null for a valid-but-nonexistent ObjectId", async () => {
      const result = await repository.findOneById(new ObjectId().toString());
      expect(result).toBeNull();
    });
  });

  describe("findOneByEmail", () => {
    it("returns the user by email", async () => {
      const seeded = await seedUser();
      const found = await repository.findOneByEmail(seeded.email);

      expect(found).toBeInstanceOf(User);
      expect(found!.email).toBe(seeded.email);
      expect(found!.id).toBe(seeded.id);
    });

    it("returns null when email is not found", async () => {
      const result = await repository.findOneByEmail(`${randomUUID()}@missing.test`);
      expect(result).toBeNull();
    });
  });

  describe("findAllByIds", () => {
    it("returns all users with matching ids", async () => {
      const a = await seedUser();
      const b = await seedUser();

      const result = await repository.findAllByIds([a.id, b.id]);

      expect(result).toHaveLength(2);
      const resultIds = result.map((u) => u.id).sort();
      expect(resultIds).toEqual([a.id, b.id].sort());
    });

    it("filters out invalid ids and returns only valid matches", async () => {
      const seeded = await seedUser();

      const result = await repository.findAllByIds([seeded.id, "invalid-id"]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(seeded.id);
    });

    it("returns empty array when all ids are invalid", async () => {
      const result = await repository.findAllByIds(["invalid-1", "invalid-2"]);
      expect(result).toEqual([]);
    });

    it("returns empty array when ids are valid but no user matches", async () => {
      const result = await repository.findAllByIds([
        new ObjectId().toString(),
        new ObjectId().toString(),
      ]);
      expect(result).toEqual([]);
    });
  });

  describe("update", () => {
    it("persists role changes and returns the updated user", async () => {
      const seeded = await seedUser();
      expect(seeded.role).toBe(UserRole.USER);

      const updated = seeded.withRole(UserRole.ADMIN);
      const result = await repository.update(updated);

      expect(result).toBeInstanceOf(User);
      expect(result!.role).toBe(UserRole.ADMIN);
      expect(result!.id).toBe(seeded.id);

      const roundTripped = await repository.findOneById(seeded.id);
      expect(roundTripped!.role).toBe(UserRole.ADMIN);
    });

    it("persists emailVerified changes", async () => {
      const seeded = await seedUser();
      const target = !seeded.emailVerified;

      const updated = seeded.withEmailVerified(target);
      const result = await repository.update(updated);

      expect(result).toBeInstanceOf(User);
      expect(result!.emailVerified).toBe(target);

      const roundTripped = await repository.findOneById(seeded.id);
      expect(roundTripped!.emailVerified).toBe(target);
    });

    it("returns null for a user whose id is not a valid ObjectId", async () => {
      const user = User.create({
        email: `${randomUUID()}@test.test`,
        firstName: "John",
        lastName: "Doe",
      });

      const result = await repository.update(user);
      expect(result).toBeNull();
    });

    it("returns null when the user is not found", async () => {
      const user = User.loadFromDb({
        id: new ObjectId().toString(),
        email: `${randomUUID()}@ghost.test`,
        firstName: "Ghost",
        lastName: "User",
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferredLanguage: Language.en,
      });

      const result = await repository.update(user);
      expect(result).toBeNull();
    });

    it("persists preferredLanguage changes", async () => {
      const seeded = await seedUser();
      expect(seeded.preferredLanguage).toBe(Language.en);

      const updated = seeded.withPreferredLanguage(Language.de);
      const result = await repository.update(updated);

      expect(result).toBeInstanceOf(User);
      expect(result!.preferredLanguage).toBe(Language.de);

      const roundTripped = await repository.findOneById(seeded.id);
      expect(roundTripped!.preferredLanguage).toBe(Language.de);
    });

    it("persists name changes via withName", async () => {
      const seeded = await seedUser();

      const updated = seeded.withName("Jane", "Roe");
      const result = await repository.update(updated);

      expect(result).toBeInstanceOf(User);
      expect(result!.firstName).toBe("Jane");
      expect(result!.lastName).toBe("Roe");
      expect(result!.name).toBe("Jane Roe");

      const roundTripped = await repository.findOneById(seeded.id);
      expect(roundTripped!.firstName).toBe("Jane");
      expect(roundTripped!.lastName).toBe("Roe");
      expect(roundTripped!.name).toBe("Jane Roe");
    });
  });
});
