import type { UserDto } from "@open-dpp/dto";
import { Language, MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useUserStore } from "./user";

function buildUser(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: "user-1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    name: "Jane Doe",
    image: null,
    emailVerified: true,
    preferredLanguage: Language.en,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("userStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("has no profile initially", () => {
    const userStore = useUserStore();
    expect(userStore.me).toBeNull();
  });

  it("stores the profile via setMe", () => {
    const userStore = useUserStore();
    const user = buildUser();
    userStore.setMe(user);
    expect(userStore.me).toEqual(user);
  });

  it("replaces the profile on subsequent setMe calls", () => {
    const userStore = useUserStore();
    userStore.setMe(buildUser());
    userStore.setMe(buildUser({ firstName: "Janet" }));
    expect(userStore.me?.firstName).toBe("Janet");
  });

  it("clears the profile via setMe(null)", () => {
    const userStore = useUserStore();
    userStore.setMe(buildUser());
    userStore.setMe(null);
    expect(userStore.me).toBeNull();
  });

  it("reset clears user, me, and memberRole", () => {
    const userStore = useUserStore();
    userStore.user = { role: UserRoleDto.USER, id: "user-1" };
    userStore.setMe(buildUser());
    userStore.memberRole = MemberRoleDto.OWNER;
    userStore.reset();
    expect(userStore.me).toBeNull();
    expect(userStore.user).toEqual({ role: UserRoleDto.ANONYMOUS, id: null });
    expect(userStore.memberRole).toBeUndefined();
  });
});
