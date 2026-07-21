/**
 * Tests the GS1 Digital Link prompt wiring in UniqueProductIdentifierListView.
 *
 * Regression for AUDIT_GENERAL M3: the GS1 create response is the list-item
 * shape (carries `type`), so the prompt must open for GS1 creates and stay
 * closed for internal ones. Also covers the two downstream prompt bugs:
 * "Add link" must carry the UPI (`createForUpi` query) and ANY close of the
 * prompt (Skip, ESC, mask) must reload the list.
 */
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import type { UniqueProductIdentifierListItemDto } from "@open-dpp/dto";

const { fetchUpis, routerPush, routerReplace } = vi.hoisted(() => ({
  fetchUpis: vi.fn(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("../../composables/unique-product-identifiers", async () => {
  const { ref } = await import("vue");
  return {
    useUniqueProductIdentifiers: () => ({
      upis: ref([]),
      loading: ref(false),
      fetchUniqueProductIdentifiers: fetchUpis,
      createGs1Upi: vi.fn(),
      createInternalUpi: vi.fn(),
      deleteUpi: vi.fn(),
    }),
  };
});

vi.mock("../../lib/api-client", () => ({
  default: { dpp: { passports: { getById: vi.fn() } } },
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({
    params: { organizationId: "org-1", passportId: "pass-1" },
    query: {},
  }),
  useRouter: () => ({ push: routerPush, replace: routerReplace }),
}));

vi.mock("primevue", () => ({
  DataTable: defineComponent({
    name: "DataTable",
    props: ["value", "loading"],
    setup(_, { slots }) {
      return () => h("div", slots.header?.() ?? []);
    },
  }),
  Column: defineComponent({ name: "Column", template: "<div />" }),
}));

vi.mock(
  "../../components/unique-product-identifier/UniqueProductIdentifierCreateDialog.vue",
  () => ({
    default: defineComponent({
      name: "UniqueProductIdentifierCreateDialog",
      props: ["visible", "passportId", "isDraft", "createGs1Upi", "createInternalUpi"],
      emits: ["created", "update:visible"],
      template: "<div />",
    }),
  }),
);

vi.mock("../../components/unique-product-identifier/Gs1DigitalLinkPromptDialog.vue", () => ({
  default: defineComponent({
    name: "Gs1DigitalLinkPromptDialog",
    props: ["visible", "upi"],
    emits: ["addLink", "skip", "update:visible"],
    setup(props) {
      return () => (props.visible ? h("div", { "data-testid": "gs1-prompt" }) : null);
    },
  }),
}));

import UniqueProductIdentifierListView from "./UniqueProductIdentifierListView.vue";

const i18n = createI18n({
  legacy: false,
  locale: "en",
  messages: { en: {} },
  missingWarn: false,
  fallbackWarn: false,
});

const gs1ListItem: UniqueProductIdentifierListItemDto = {
  uuid: "0d4dbe93-6a29-4e15-8f0e-0f3f0d4f7f11",
  referenceId: "8f6f2c4e-9a51-4c26-9d3a-2f1f0a7b6c5d",
  type: "GS1",
  gtin: "04006381333931",
  batch: null,
  serial: null,
  granularity: "model",
  digitalLink: "https://id.example.com/01/04006381333931",
  passportPublished: false,
  permalink: null,
};

const internalListItem: UniqueProductIdentifierListItemDto = {
  ...gs1ListItem,
  uuid: "1e5ecfa4-7b3a-4f26-8a1b-3c2d1e0f9a8b",
  type: "OPEN_DPP_UUID",
  gtin: null,
  granularity: null,
  digitalLink: null,
};

async function mountView() {
  const wrapper = mount(UniqueProductIdentifierListView, {
    global: {
      plugins: [i18n],
      stubs: { Button: true, RouterLink: true },
    },
  });
  await nextTick();
  await nextTick();
  return wrapper;
}

async function emitCreated(
  wrapper: Awaited<ReturnType<typeof mountView>>,
  upi: UniqueProductIdentifierListItemDto,
) {
  wrapper.findComponent({ name: "UniqueProductIdentifierCreateDialog" }).vm.$emit("created", upi);
  await nextTick();
  await nextTick();
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchUpis.mockResolvedValue({ paging_metadata: { cursor: null }, result: [] });
});

describe("UniqueProductIdentifierListView — GS1 Digital Link prompt", () => {
  it("opens the prompt after a GS1 create and defers the list reload", async () => {
    const wrapper = await mountView();
    expect(fetchUpis).toHaveBeenCalledTimes(1); // onMounted nextPage

    await emitCreated(wrapper, gs1ListItem);

    expect(wrapper.find("[data-testid='gs1-prompt']").exists()).toBe(true);
    expect(fetchUpis).toHaveBeenCalledTimes(1); // reload waits until the prompt closes
  });

  it("skips the prompt after an internal create and reloads immediately", async () => {
    const wrapper = await mountView();

    await emitCreated(wrapper, internalListItem);

    expect(wrapper.find("[data-testid='gs1-prompt']").exists()).toBe(false);
    expect(fetchUpis).toHaveBeenCalledTimes(2);
  });

  it("'Add link' navigates to the permalink list with the UPI preselected (createForUpi)", async () => {
    const wrapper = await mountView();
    await emitCreated(wrapper, gs1ListItem);

    wrapper.findComponent({ name: "Gs1DigitalLinkPromptDialog" }).vm.$emit("addLink", gs1ListItem);
    await nextTick();

    expect(routerPush).toHaveBeenCalledWith({
      name: "passportPermalinks",
      params: { organizationId: "org-1", passportId: "pass-1" },
      query: { createForUpi: gs1ListItem.uuid },
    });
    // Navigation unmounts the view; no reload is triggered from this path.
    expect(fetchUpis).toHaveBeenCalledTimes(1);
  });

  it("reloads the list on ANY close of the prompt (Skip, ESC, mask)", async () => {
    const wrapper = await mountView();
    await emitCreated(wrapper, gs1ListItem);
    expect(fetchUpis).toHaveBeenCalledTimes(1);

    // ESC/mask/Skip all surface as the dialog turning its visible model off.
    wrapper.findComponent({ name: "Gs1DigitalLinkPromptDialog" }).vm.$emit("update:visible", false);
    await nextTick();
    await nextTick();

    expect(wrapper.find("[data-testid='gs1-prompt']").exists()).toBe(false);
    expect(fetchUpis).toHaveBeenCalledTimes(2);
  });
});
