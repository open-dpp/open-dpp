import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePresentationMenu } from "./presentation-menu";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routeParams: { permalink: "my-product" } as Record<string, string>,
  routeFullPath: "/p/my-product?language=de",
  sessionData: null as unknown,
  organizations: [] as { id: string }[],
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ params: mocks.routeParams, fullPath: mocks.routeFullPath }),
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}));

vi.mock("../auth-client.ts", () => ({
  authClient: {
    useSession: () => ref({ data: mocks.sessionData }),
  },
}));

vi.mock("../stores/organizations.ts", () => ({
  useOrganizationsStore: () => ({
    get organizations() {
      return mocks.organizations;
    },
  }),
}));

describe("usePresentationMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.routeParams = { permalink: "my-product" };
    mocks.routeFullPath = "/p/my-product?language=de";
    mocks.sessionData = null;
    mocks.organizations = [];
  });

  describe("permalink", () => {
    it("returns the permalink from route params", () => {
      const { permalink } = usePresentationMenu();

      expect(permalink.value).toBe("my-product");
    });

    it("returns empty string when permalink param is missing", () => {
      mocks.routeParams = {};

      const { permalink } = usePresentationMenu();

      expect(permalink.value).toBe("");
    });
  });

  describe("menuItems", () => {
    it("includes toPass, chatWithAI and signIn items when not signed in", () => {
      const { menuItems } = usePresentationMenu();

      expect(menuItems.value).toHaveLength(3);
      expect(menuItems.value[2]).toEqual(
        expect.objectContaining({
          label: "auth.signin.button",
          icon: "pi pi-sign-in",
        }),
      );
      expect(menuItems.value[0]).toEqual(
        expect.objectContaining({
          label: "presentation.toPass",
          icon: "pi pi-home",
        }),
      );
      expect(menuItems.value[1]).toEqual(
        expect.objectContaining({
          label: "presentation.chatWithAI",
          icon: "pi pi-comments",
        }),
      );
    });

    it("includes backToApp and logout items and no sign in for a member", () => {
      mocks.sessionData = { user: { id: "u1" } };
      mocks.organizations = [{ id: "org-1" }];

      const { menuItems } = usePresentationMenu();

      expect(menuItems.value.map((item) => item.label)).toEqual([
        "presentation.toPass",
        "presentation.chatWithAI",
        "presentation.backToApp",
        "user.logout",
      ]);
      expect(menuItems.value[2]).toEqual(expect.objectContaining({ icon: "pi pi-arrow-left" }));
      expect(menuItems.value[3]).toEqual(expect.objectContaining({ icon: "pi pi-sign-out" }));
    });

    it("has no backToApp for a signed-in user without any organization, but profile and logout", () => {
      mocks.sessionData = { user: { id: "guest" } };
      mocks.organizations = [];

      const { menuItems } = usePresentationMenu();

      expect(menuItems.value.map((item) => item.label)).toEqual([
        "presentation.toPass",
        "presentation.chatWithAI",
        "user.profile",
        "user.logout",
      ]);
    });

    it("has no profile entry for a member, who finds it in the app", () => {
      mocks.sessionData = { user: { id: "u1" } };
      mocks.organizations = [{ id: "org-1" }];

      const { menuItems } = usePresentationMenu();

      expect(menuItems.value.map((item) => item.label)).not.toContain("user.profile");
    });

    it("profile command opens the profile and returns to the current product page", () => {
      mocks.sessionData = { user: { id: "guest" } };

      const { menuItems } = usePresentationMenu();

      menuItems.value[2]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith({
        name: "GuestProfile",
        query: {
          redirect: encodeURIComponent(`${window.location.origin}/p/my-product?language=de`),
        },
      });
    });

    it("keeps backToApp for a user who is a member somewhere else than the shown passport", () => {
      // member of one organization, guest of the organization which owns this passport
      mocks.sessionData = { user: { id: "u1" } };
      mocks.organizations = [{ id: "own-org" }];

      const { menuItems } = usePresentationMenu();

      expect(menuItems.value.map((item) => item.label)).toContain("presentation.backToApp");
    });

    it("has no logout when not signed in", () => {
      const { menuItems } = usePresentationMenu();

      expect(menuItems.value.map((item) => item.label)).not.toContain("user.logout");
    });

    it("toPass command navigates to presentation view", () => {
      const { menuItems } = usePresentationMenu();

      menuItems.value[0]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith("/p/my-product");
    });

    it("chatWithAI command navigates to chat view", () => {
      const { menuItems } = usePresentationMenu();

      menuItems.value[1]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith("/p/my-product/chat");
    });

    it("signIn command signs in and returns to the current product page", () => {
      const { menuItems } = usePresentationMenu();

      menuItems.value[2]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith({
        name: "Signin",
        query: {
          redirect: encodeURIComponent(`${window.location.origin}/p/my-product?language=de`),
        },
      });
    });

    it("backToApp command navigates to root", () => {
      mocks.sessionData = { user: { id: "u1" } };
      mocks.organizations = [{ id: "org-1" }];

      const { menuItems } = usePresentationMenu();

      menuItems.value[2]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith("/");
    });

    it("logout command signs out and returns to the current product page", () => {
      mocks.sessionData = { user: { id: "guest" } };

      const { menuItems } = usePresentationMenu();

      menuItems.value[3]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith({
        name: "Signout",
        query: {
          redirect: encodeURIComponent(`${window.location.origin}/p/my-product?language=de`),
        },
      });
    });
  });

  describe("navigateToAiChat", () => {
    it("navigates to the chat route for current permalink", () => {
      const { navigateToAiChat } = usePresentationMenu();

      navigateToAiChat();

      expect(mocks.routerPush).toHaveBeenCalledWith("/p/my-product/chat");
    });
  });
});
