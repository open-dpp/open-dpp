/**
 * Guards the "passport published" banner of the passport-scoped permalink list.
 *
 * Bug this covers (PR #615 review): the banner was derived from `publishedUrl`
 * on the rows, so a draft passport that carries a frozen permalink (published →
 * archived → restored, or a legacy row) announced itself as published — right
 * after creating a GS1 link, which never publishes anything. Publication is an
 * independent action, so the banner must follow the passport's real status.
 */

import type { PermalinkPublicDto } from "@open-dpp/dto";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";
import { permalinkPublicPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PrimeVue from "primevue/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";
import enUS from "../../translations/en-US.json";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { getById, getPermalinks, logErrorWithNotification, addSuccess } = vi.hoisted(() => ({
  getById: vi.fn(),
  getPermalinks: vi.fn(),
  logErrorWithNotification: vi.fn(),
  addSuccess: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      passports: { getById, getPermalinks },
      permalinks: { setPrimary: vi.fn(), delete: vi.fn() },
    },
  },
}));

vi.mock("../../const.ts", () => ({
  API_URL: "http://localhost:3000/api",
  MARKETPLACE_URL: "http://localhost:3000/api",
  VIEW_ROOT_URL: "http://localhost:3000",
  MEDIA_SERVICE_URL: "http://localhost:3000/api",
  AGENT_SERVER_URL: "http://localhost:3000/api",
  ANALYTICS_URL: "http://localhost:3000/api",
  AGENT_WEBSOCKET_URL: "http://localhost:3000",
  LAST_SELECTED_ORGANIZATION_ID_KEY: "open-dpp-local-last-selected-organization-id",
  LAST_SELECTED_LANGUAGE: "open-dpp-local-last-language",
  AI_INTEGRATION_ID: "ai-integration",
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ params: { passportId: "passport-1", organizationId: "org-1" }, query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({ require: vi.fn() }),
}));

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));

vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification: addSuccess }),
}));

// Dialogs and the pagination bar are irrelevant here and drag in heavy
// dependencies. Each factory stays self-contained — vi.mock calls are hoisted
// above every top-level binding.
vi.mock("../../components/permalinks/PermalinkCreateGs1LinkDialog.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));
vi.mock("../../components/permalinks/PermalinkEditDialog.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));
vi.mock("../../components/permalinks/PermalinkQrCode.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));
vi.mock("../../components/pagination/TablePagination.vue", () => ({
  default: defineComponent({ template: "<div />" }),
}));

// jsdom has no matchMedia; PrimeVue's DataTable touches it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import Button from "primevue/button";
import PermalinkListView from "./PermalinkListView.vue";

const i18n = createI18n({ locale: "en-US", legacy: false, messages: { "en-US": enUS } });

/** A frozen permalink row — the state that used to trigger the false banner. */
function makeFrozenPermalink(): PermalinkPublicDto {
  return permalinkPublicPlainFactory.build({
    publishedUrl: "https://example.com/p/frozen-slug",
    publicUrl: "https://example.com/p/frozen-slug",
  });
}

async function mountView(options: {
  status?: (typeof DigitalProductDocumentStatusDto)[keyof typeof DigitalProductDocumentStatusDto];
  statusFails?: boolean;
  permalinks?: PermalinkPublicDto[];
}) {
  if (options.statusFails) {
    getById.mockRejectedValue(new Error("status fetch failed"));
  } else {
    getById.mockResolvedValue({
      status: 200,
      data: {
        lastStatusChange: {
          currentStatus: options.status ?? DigitalProductDocumentStatusDto.Draft,
        },
      },
    });
  }
  getPermalinks.mockResolvedValue({
    data: {
      paging_metadata: { cursor: null },
      result: options.permalinks ?? [makeFrozenPermalink()],
    },
  });

  const wrapper = mount(PermalinkListView, {
    global: {
      plugins: [i18n, PrimeVue],
      components: { Button },
      stubs: { Dialog: true, ConfirmDialog: true },
    },
  });
  // onMounted awaits the status fetch and the first page before rendering rows.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await wrapper.vm.$nextTick();
  return wrapper;
}

describe("PermalinkListView – published banner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  it("stays hidden for a draft passport, even when a permalink row is frozen", async () => {
    const wrapper = await mountView({ status: DigitalProductDocumentStatusDto.Draft });

    expect(wrapper.find('[data-testid="permalink-frozen-info"]').exists()).toBe(false);
    expect(getById).toHaveBeenCalledWith("passport-1");
  });

  it("shows once the passport is published", async () => {
    const wrapper = await mountView({ status: DigitalProductDocumentStatusDto.Published });

    const banner = wrapper.find('[data-testid="permalink-frozen-info"]');
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toBe(enUS.permalink.list.frozenInfo);
  });

  it("stays hidden and still renders the list when the status fetch fails", async () => {
    const permalink = makeFrozenPermalink();
    const wrapper = await mountView({ statusFails: true, permalinks: [permalink] });

    expect(wrapper.find('[data-testid="permalink-frozen-info"]').exists()).toBe(false);
    expect(wrapper.find(`[data-testid="permalink-public-url-${permalink.id}"]`).exists()).toBe(
      true,
    );
  });
});
