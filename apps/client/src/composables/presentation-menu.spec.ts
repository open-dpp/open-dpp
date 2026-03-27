import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { usePresentationMenu } from "./presentation-menu";

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routeParams: { permalink: "my-product" } as Record<string, string>,
  sessionData: null as unknown,
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ params: mocks.routeParams }),
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}));

vi.mock("../auth-client.ts", () => ({
  authClient: {
    useSession: () => ref({ data: mocks.sessionData }),
  },
}));

describe("usePresentationMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.routeParams = { permalink: "my-product" };
    mocks.sessionData = null;
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
    it("includes toPass and chatWithAI items when not signed in", () => {
      const { menuItems } = usePresentationMenu();

      expect(menuItems.value).toHaveLength(2);
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

    it("includes backToApp item when signed in", () => {
      mocks.sessionData = { user: { id: "u1" } };

      const { menuItems } = usePresentationMenu();

      expect(menuItems.value).toHaveLength(3);
      expect(menuItems.value[2]).toEqual(
        expect.objectContaining({
          label: "presentation.backToApp",
          icon: "pi pi-arrow-left",
        }),
      );
    });

    it("toPass command navigates to presentation view", () => {
      const { menuItems } = usePresentationMenu();

      menuItems.value[0]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith("/presentation/my-product");
    });

    it("chatWithAI command navigates to chat view", () => {
      const { menuItems } = usePresentationMenu();

      menuItems.value[1]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith(
        "/presentation/my-product/chat",
      );
    });

    it("backToApp command navigates to root", () => {
      mocks.sessionData = { user: { id: "u1" } };

      const { menuItems } = usePresentationMenu();

      menuItems.value[2]!.command();

      expect(mocks.routerPush).toHaveBeenCalledWith("/");
    });
  });

  describe("navigateToAiChat", () => {
    it("navigates to the chat route for current permalink", () => {
      const { navigateToAiChat } = usePresentationMenu();

      navigateToAiChat();

      expect(mocks.routerPush).toHaveBeenCalledWith(
        "/presentation/my-product/chat",
      );
    });
  });
});
