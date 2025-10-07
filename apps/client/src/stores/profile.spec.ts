import { createPinia, setActivePinia } from "pinia";
import { expect, it } from "vitest";
import { useProfileStore } from "./profile";

describe("profileStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should set profile", () => {
    const profileStore = useProfileStore();
    const profile = {
      name: "John Doe",
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
    };
    profileStore.setProfile(profile);
    expect(profileStore.profile).toEqual(profile);
  });
});
