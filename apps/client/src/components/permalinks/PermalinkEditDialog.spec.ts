import type { PermalinkPublicDto } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";

// ---------------------------------------------------------------------------
// Mocks — declared before the component import so vi.mock hoisting applies.
// ---------------------------------------------------------------------------

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

vi.mock("../../lib/api-client", () => ({
  default: { dpp: { permalinks: { updateById: vi.fn() } } },
}));

// Stub the data-attributes editor with a button that emits a fixed valid map,
// so a "user edit" is a single click and the parent's live preview recomputes.
vi.mock("./Gs1DataAttributesField.vue", () => ({
  default: defineComponent({
    name: "Gs1DataAttributesField",
    inheritAttrs: false, // keep our stub's data-testid; don't let the parent's fall through
    props: ["modelValue"],
    emits: ["update:modelValue"],
    setup(_, { emit }) {
      return () =>
        h("button", {
          "data-testid": "stub-emit-attrs",
          onClick: () => emit("update:modelValue", { "3103": "000750" }),
        });
    },
  }),
}));

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      common: { cancel: "Cancel", save: "Save", edit: "Edit" },
      permalink: {
        edit: {
          title: "Edit Permalink",
          type: { label: "Type", presentation: "Presentation", gs1Link: "GS1 Digital Link" },
          locked: "This permalink is published and can no longer be changed.",
          slug: { label: "Short name", placeholder: "Last path segment" },
          baseUrl: { label: "Custom base URL" },
          gs1DataAttributes: "GS1 Data Attributes (optional)",
          gs1Preview: { label: "GS1 Digital Link preview" },
        },
      },
    },
  },
});

// Unresolved PrimeVue components (auto-registered in the app build, absent from
// the vitest plugin set) — stub so the default slot renders deterministically.
const stubs = {
  Dialog: { template: "<div><slot /></div>" },
  InputText: true,
  Button: true,
};

import PermalinkEditDialog from "./PermalinkEditDialog.vue";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const upiId = "44444444-4444-4444-8444-444444444444";
const configId = "22222222-2222-4222-8222-222222222222";
const isoNow = "2026-05-12T00:00:00.000Z";

function makeGs1Permalink(overrides: Partial<PermalinkPublicDto> = {}): PermalinkPublicDto {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    kind: "gs1-link",
    slug: null,
    baseUrl: null,
    presentationConfigurationId: null,
    uniqueProductIdentifierId: upiId,
    primary: false,
    gs1DataAttributes: null,
    publishedUrl: null,
    createdAt: isoNow,
    updatedAt: isoNow,
    publicUrl: "https://id.example.com/01/04006381333931",
    fallbackBaseUrl: "https://id.example.com",
    fallbackBaseUrlSource: "instance",
    ...overrides,
  };
}

function mountDialog(permalink: PermalinkPublicDto) {
  return mount(PermalinkEditDialog, {
    global: { plugins: [i18n], stubs },
    props: { visible: true, permalink },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PermalinkEditDialog — GS1 Digital Link preview", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("shows the GS1 Digital Link URL for a gs1-link permalink", async () => {
    const wrapper = mountDialog(makeGs1Permalink());
    await nextTick();

    expect(wrapper.find('[data-testid="permalink-edit-gs1-preview"]').text()).toBe(
      "https://id.example.com/01/04006381333931",
    );
  });

  it("updates the preview live as GS1 data attributes change", async () => {
    const wrapper = mountDialog(makeGs1Permalink());
    await nextTick();

    // A "user edit" in the data-attributes editor.
    await wrapper.find('[data-testid="stub-emit-attrs"]').trigger("click");
    await nextTick();

    expect(wrapper.find('[data-testid="permalink-edit-gs1-preview"]').text()).toBe(
      "https://id.example.com/01/04006381333931?3103=000750",
    );
  });

  it("shows the frozen URL and does not react to edits once published", async () => {
    const frozen = "https://frozen.example.com/01/04006381333931?17=251231";
    const wrapper = mountDialog(makeGs1Permalink({ publishedUrl: frozen }));
    await nextTick();

    await wrapper.find('[data-testid="stub-emit-attrs"]').trigger("click");
    await nextTick();

    expect(wrapper.find('[data-testid="permalink-edit-gs1-preview"]').text()).toBe(frozen);
  });

  it("does not render the GS1 preview for a presentation permalink", async () => {
    const wrapper = mountDialog(
      makeGs1Permalink({
        kind: "presentation",
        uniqueProductIdentifierId: null,
        presentationConfigurationId: configId,
        gs1DataAttributes: null,
        publicUrl: "https://instance.example.com/p/some-slug",
      }),
    );
    await nextTick();

    expect(wrapper.find('[data-testid="permalink-edit-gs1-preview"]').exists()).toBe(false);
  });
});
