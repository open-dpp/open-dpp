import { expect } from "@jest/globals";
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
    };

    const user = User.loadFromDb(dbProps);

    expect(user.id).toBe(dbProps.id);
    expect(user.email).toBe(dbProps.email);
    expect(user.role).toBe(dbProps.role);
    expect(user.createdAt).toEqual(dbProps.createdAt);
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
});
