import { expect } from "@jest/globals";
import { Language } from "@open-dpp/dto";
import { User } from "./user";
import { UserRole } from "./user-role.enum";

describe("user", () => {
  it("should create a user with valid properties", () => {
    const props = {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      image: "image.png",
      emailVerified: true,
      role: UserRole.ADMIN,
    };

    const user = User.create(props);

    expect(user.id).toBeDefined();
    expect(user.email).toBe(props.email);
    expect(user.firstName).toBe(props.firstName);
    expect(user.lastName).toBe(props.lastName);
    expect(user.name).toBe("John Doe");
    expect(user.role).toBe(props.role);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it("should load user from database properties", () => {
    const now = new Date();
    const dbProps = {
      id: "user-123",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      image: "image.png",
      emailVerified: true,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
      preferredLanguage: Language.en,
    };

    const user = User.loadFromDb(dbProps);

    expect(user.id).toBe(dbProps.id);
    expect(user.email).toBe(dbProps.email);
    expect(user.role).toBe(dbProps.role);
    expect(user.createdAt).toEqual(dbProps.createdAt);
  });

  it("should return a new user with the given role via withRole", () => {
    const user = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
    });

    const admin = user.withRole(UserRole.ADMIN);

    expect(admin).not.toBe(user);
    expect(admin.role).toBe(UserRole.ADMIN);
    expect(admin.id).toBe(user.id);
    expect(admin.email).toBe(user.email);
    expect(user.role).toBe(UserRole.USER);
  });

  it("should format name correctly when first or last name is null", () => {
    const dbProps = {
      id: "user-123",
      email: "test@example.com",
      firstName: null,
      lastName: null,
      image: null,
      emailVerified: true,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
      banned: false,
      banReason: null,
      banExpires: null,
    };

    // Cast to any to simulate database returning nulls which might be possible at runtime
    // despite strict types, or legacy data.
    const user = User.loadFromDb(dbProps as any);
    expect(user.name).toBeNull();
  });

  it("defaults preferredLanguage to 'en' on create", () => {
    const user = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
    });

    expect(user.preferredLanguage).toBe(Language.en);
  });

  it("stores preferredLanguage passed to create", () => {
    const user = User.create({
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      preferredLanguage: Language.de,
    });

    expect(user.preferredLanguage).toBe(Language.de);
  });

  it("loads preferredLanguage from db", () => {
    const now = new Date();
    const user = User.loadFromDb({
      id: "user-123",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      emailVerified: true,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
      banned: false,
      banReason: null,
      banExpires: null,
      preferredLanguage: Language.de,
    });

    expect(user.preferredLanguage).toBe(Language.de);
  });

  describe("withName", () => {
    it("returns a new user with updated firstName and lastName and recomputed name", async () => {
      const user = User.create({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      });
      await new Promise((r) => setTimeout(r, 2));

      const renamed = user.withName("Jane", "Roe");

      expect(renamed).not.toBe(user);
      expect(renamed.firstName).toBe("Jane");
      expect(renamed.lastName).toBe("Roe");
      expect(renamed.name).toBe("Jane Roe");
      expect(renamed.id).toBe(user.id);
      expect(renamed.email).toBe(user.email);
      expect(renamed.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
    });

    it("produces a null name when both parts are null", () => {
      const user = User.create({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      });

      const renamed = user.withName(null, null);

      expect(renamed.firstName).toBeNull();
      expect(renamed.lastName).toBeNull();
      expect(renamed.name).toBeNull();
    });

    it("preserves preferredLanguage", () => {
      const user = User.create({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        preferredLanguage: Language.de,
      });

      const renamed = user.withName("Jane", "Roe");

      expect(renamed.preferredLanguage).toBe(Language.de);
    });

    it("returns the same instance when both names already match (no spurious DB writes)", () => {
      const user = User.create({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      });

      const result = user.withName("John", "Doe");

      expect(result).toBe(user);
      expect(result.updatedAt).toBe(user.updatedAt);
    });

    it("returns the same instance when both names are null and already null", () => {
      const user = User.create({
        email: "test@example.com",
        firstName: null as unknown as string,
        lastName: null as unknown as string,
      });

      const result = user.withName(null, null);

      expect(result).toBe(user);
    });

    it("returns a new instance when only firstName changes", () => {
      const user = User.create({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
      });

      const result = user.withName("Jane", "Doe");

      expect(result).not.toBe(user);
      expect(result.firstName).toBe("Jane");
      expect(result.lastName).toBe("Doe");
    });
  });

  describe("withPreferredLanguage", () => {
    it("returns a new user with the given preferredLanguage", async () => {
      const user = User.create({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        preferredLanguage: Language.en,
      });
      await new Promise((r) => setTimeout(r, 2));

      const switched = user.withPreferredLanguage(Language.de);

      expect(switched).not.toBe(user);
      expect(switched.preferredLanguage).toBe(Language.de);
      expect(switched.id).toBe(user.id);
      expect(switched.firstName).toBe(user.firstName);
      expect(switched.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
      expect(user.preferredLanguage).toBe(Language.en);
    });

    it("returns the same instance when the language already matches (no spurious DB writes)", () => {
      const user = User.create({
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        preferredLanguage: Language.de,
      });

      const result = user.withPreferredLanguage(Language.de);

      expect(result).toBe(user);
      expect(result.updatedAt).toBe(user.updatedAt);
    });
  });
});
