import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGuestProfile } from "./guest-profile";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  query: {} as Record<string, string>,
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: mocks.query }),
  useRouter: () => ({ push: mocks.routerPush }),
}));

function redirectTo(url: string) {
  return { redirect: encodeURIComponent(url) };
}

describe("useGuestProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query = {};
  });

  it("leads back to the page of this application which opened the profile", () => {
    mocks.query = redirectTo(`${window.location.origin}/p/my-product?language=de`);

    const { backTarget, goBack } = useGuestProfile();
    goBack();

    expect(backTarget.value).toBe("/p/my-product?language=de");
    expect(mocks.routerPush).toHaveBeenCalledWith("/p/my-product?language=de");
  });

  it.each([
    ["is missing", {}],
    ["leads to another site", redirectTo("https://evil.example.com/p/x")],
    ["is not a URL of this application", redirectTo("javascript:alert(1)")],
    [
      "hides another site behind dot segments",
      redirectTo(`${window.location.origin}/.//evil.test`),
    ],
  ])("has no way back if the redirect %s", (_, query) => {
    mocks.query = query;

    const { backTarget, goBack } = useGuestProfile();
    goBack();

    expect(backTarget.value).toBeUndefined();
    expect(mocks.routerPush).not.toHaveBeenCalled();
  });

  it("signs out and returns to the page which opened the profile", () => {
    mocks.query = redirectTo(`${window.location.origin}/p/my-product`);

    useGuestProfile().signOut();

    expect(mocks.routerPush).toHaveBeenCalledWith({
      name: "Signout",
      query: { redirect: encodeURIComponent(`${window.location.origin}/p/my-product`) },
    });
  });

  it("signs out to the sign in if there is no page to return to", () => {
    useGuestProfile().signOut();

    expect(mocks.routerPush).toHaveBeenCalledWith({ name: "Signout", query: {} });
  });
});
