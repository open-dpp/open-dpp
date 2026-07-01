/**
 * Slice 73 — PermalinkEditDialog (polymorphic edit: presentation & gs1-link)
 *
 * Failing tests first (RED), then the component is implemented (GREEN).
 */

import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import { createI18n } from "vue-i18n";
import type { PermalinkPublicDto } from "@open-dpp/dto";
import { permalinkPublicPlainFactory } from "@open-dpp/testing";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { updateByIdMock } = vi.hoisted(() => ({
  updateByIdMock: vi.fn(),
}));

vi.mock("../../lib/api-client", () => ({
  default: {
    dpp: {
      permalinks: {
        updateById: updateByIdMock,
      },
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

vi.mock("../../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: vi.fn() }),
}));

vi.mock("../../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Component stubs
// ---------------------------------------------------------------------------

const DialogStub = defineComponent({
  name: "Dialog",
  props: ["visible", "header", "modal"],
  emits: ["update:visible"],
  setup(props, { slots }) {
    return () =>
      h("div", { class: "dialog-stub" }, [
        props.visible ? slots.default?.() : null,
        props.visible ? slots.footer?.() : null,
      ]);
  },
});

const InputTextStub = defineComponent({
  name: "InputText",
  inheritAttrs: false,
  props: ["modelValue", "disabled", "invalid", "placeholder", "id", "autocomplete"],
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h("input", {
        value: props.modelValue,
        disabled: props.disabled,
        "data-testid": attrs["data-testid"],
        onInput: (e: Event) => emit("update:modelValue", (e.target as HTMLInputElement).value),
      });
  },
});

const ButtonStub = defineComponent({
  name: "Button",
  inheritAttrs: false,
  props: ["label", "disabled", "severity", "variant", "icon", "size"],
  emits: ["click"],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        "button",
        {
          onClick: () => emit("click"),
          disabled: props.disabled,
          "data-testid": attrs["data-testid"],
        },
        props.label ?? props.icon,
      );
  },
});

/** Stub for Gs1DataAttributesField — emits update:modelValue when the internal input changes */
const Gs1DataAttributesFieldStub = defineComponent({
  name: "Gs1DataAttributesField",
  inheritAttrs: false,
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(props, { emit, attrs }) {
    return () =>
      h("input", {
        "data-testid": attrs["data-testid"] ?? "gs1-data-attributes-field",
        value: JSON.stringify(props.modelValue ?? {}),
        onInput: (e: Event) => {
          try {
            emit("update:modelValue", JSON.parse((e.target as HTMLInputElement).value));
          } catch {
            // ignore
          }
        },
      });
  },
});

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      common: { cancel: "Cancel", save: "Save" },
      permalink: {
        edit: {
          title: "Edit Permalink",
          type: {
            label: "Type",
            presentation: "Presentation",
            gs1Link: "GS1 Digital Link",
          },
          saveSuccess: "Permalink saved.",
          saveError: "Could not save permalink.",
          slugConflict: "This slug is already in use by another permalink.",
          locked: "This permalink is published and can no longer be changed.",
          slug: {
            label: "Short name",
            placeholder: "Last path segment",
          },
          baseUrl: {
            label: "Custom base URL",
          },
          gs1DataAttributes: "GS1 Data Attributes (optional)",
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

// Presentation permalink: factory default kind is "presentation". slug "my-product"
// is asserted in the slug input; baseUrl null and publishedUrl null keep the dialog
// editable. Other fields (presentationConfigurationId, primary, publicUrl, timestamps)
// are unused by the component and not asserted.
const PRESENTATION_PERMALINK: PermalinkPublicDto = permalinkPublicPlainFactory.build({
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  slug: "my-product",
});

// GS1-link permalink: transient `gs1: true` flips kind to "gs1-link" (slug null,
// uniqueProductIdentifierId set). gs1DataAttributes override reproduces the initial value.
const GS1_LINK_PERMALINK: PermalinkPublicDto = permalinkPublicPlainFactory.build(
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    gs1DataAttributes: { "17": "251231" },
  },
  { transient: { gs1: true } },
);

// Published presentation permalink: publishedUrl override drives the `locked` state
// (locked banner + disabled Save).
const PUBLISHED_PERMALINK: PermalinkPublicDto = permalinkPublicPlainFactory.build({
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  slug: "published-product",
  publishedUrl: "https://example.com/p/published-product",
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

import PermalinkEditDialog from "./PermalinkEditDialog.vue";

function mountDialog(permalink: PermalinkPublicDto, visible = true) {
  return mount(PermalinkEditDialog, {
    global: {
      plugins: [i18n],
      stubs: {
        Dialog: DialogStub,
        InputText: InputTextStub,
        Button: ButtonStub,
        Gs1DataAttributesField: Gs1DataAttributesFieldStub,
      },
    },
    props: {
      visible,
      permalink,
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PermalinkEditDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("(0) type — read-only kind shown for both permalink kinds", () => {
    it("shows the presentation type label", async () => {
      const wrapper = mountDialog(PRESENTATION_PERMALINK);
      await nextTick();

      const typeValue = wrapper.find("[data-testid='permalink-edit-type-value']");
      expect(typeValue.exists()).toBe(true);
      expect(typeValue.text()).toBe("Presentation");
    });

    it("shows the gs1-link type label", async () => {
      const wrapper = mountDialog(GS1_LINK_PERMALINK);
      await nextTick();

      const typeValue = wrapper.find("[data-testid='permalink-edit-type-value']");
      expect(typeValue.exists()).toBe(true);
      expect(typeValue.text()).toBe("GS1 Digital Link");
    });
  });

  describe("(a) presentation permalink — slug + baseUrl fields + saves via updateById", () => {
    it("renders slug and baseUrl fields for a presentation permalink", async () => {
      const wrapper = mountDialog(PRESENTATION_PERMALINK);
      await nextTick();

      // Slug field exists and is pre-filled
      const slugInput = wrapper.find("[data-testid='permalink-edit-slug']");
      expect(slugInput.exists()).toBe(true);
      expect((slugInput.element as HTMLInputElement).value).toBe("my-product");

      // BaseUrl field exists
      const baseUrlInput = wrapper.find("[data-testid='permalink-edit-base-url']");
      expect(baseUrlInput.exists()).toBe(true);

      // Gs1DataAttributesField NOT shown for presentation kind
      const gs1Field = wrapper.find("[data-testid='permalink-edit-gs1-data-attributes']");
      expect(gs1Field.exists()).toBe(false);
    });

    it("saves via permalinks.updateById with slug + baseUrl, emits updated", async () => {
      const updatedPermalink = {
        ...PRESENTATION_PERMALINK,
        slug: "updated-slug",
        updatedAt: "2026-01-02T00:00:00.000Z",
      };
      updateByIdMock.mockResolvedValueOnce({ data: updatedPermalink });

      const wrapper = mountDialog(PRESENTATION_PERMALINK);
      await nextTick();

      // Change the slug
      const slugInput = wrapper.find("[data-testid='permalink-edit-slug']");
      await slugInput.setValue("updated-slug");
      await nextTick();

      // Click Save
      const saveBtn = wrapper.find("[data-testid='permalink-edit-save']");
      await saveBtn.trigger("click");
      await nextTick();
      await nextTick();

      expect(updateByIdMock).toHaveBeenCalledWith(
        PRESENTATION_PERMALINK.id,
        expect.objectContaining({ slug: "updated-slug" }),
      );
      // Should NOT include gs1 fields
      const call = updateByIdMock.mock.calls[0]![1];
      expect(call).not.toHaveProperty("gs1DataAttributes");

      expect(wrapper.emitted("updated")).toBeTruthy();
    });
  });

  describe("(b) gs1-link permalink — shows Gs1DataAttributesField + baseUrl in update body", () => {
    it("renders baseUrl field and Gs1DataAttributesField for a gs1-link permalink", async () => {
      const wrapper = mountDialog(GS1_LINK_PERMALINK);
      await nextTick();

      // Gs1DataAttributesField shown for gs1-link kind
      const gs1Field = wrapper.find("[data-testid='permalink-edit-gs1-data-attributes']");
      expect(gs1Field.exists()).toBe(true);

      // The single "Custom base URL" field is shown for both kinds.
      const baseUrlInput = wrapper.find("[data-testid='permalink-edit-base-url']");
      expect(baseUrlInput.exists()).toBe(true);

      // A GS1 Digital Link has no "Short name" — the slug field is not shown.
      expect(wrapper.find("[data-testid='permalink-edit-slug']").exists()).toBe(false);
    });

    it("includes baseUrl and gs1DataAttributes in the updateById call for gs1-link", async () => {
      const updatedPermalink = {
        ...GS1_LINK_PERMALINK,
        baseUrl: "https://id2.example.com",
        updatedAt: "2026-01-02T00:00:00.000Z",
      };
      updateByIdMock.mockResolvedValueOnce({ data: updatedPermalink });

      const wrapper = mountDialog(GS1_LINK_PERMALINK);
      await nextTick();

      // Update baseUrl
      const baseUrlInput = wrapper.find("[data-testid='permalink-edit-base-url']");
      await baseUrlInput.setValue("https://id2.example.com");
      await nextTick();

      // Update gs1DataAttributes via the stub (simulate new value)
      const gs1Field = wrapper.find("[data-testid='permalink-edit-gs1-data-attributes']");
      await gs1Field.setValue(JSON.stringify({ "17": "261231" }));
      await nextTick();

      // Click Save
      const saveBtn = wrapper.find("[data-testid='permalink-edit-save']");
      await saveBtn.trigger("click");
      await nextTick();
      await nextTick();

      expect(updateByIdMock).toHaveBeenCalledWith(
        GS1_LINK_PERMALINK.id,
        expect.objectContaining({
          baseUrl: "https://id2.example.com",
          gs1DataAttributes: { "17": "261231" },
        }),
      );
      // A GS1 Digital Link has no "Short name" — slug is not sent.
      expect(updateByIdMock.mock.calls[0]![1]).not.toHaveProperty("slug");

      expect(wrapper.emitted("updated")).toBeTruthy();
    });
  });

  describe("(c) published permalink — all fields locked, Save disabled", () => {
    it("shows the locked banner and disables Save when publishedUrl is set", async () => {
      const wrapper = mountDialog(PUBLISHED_PERMALINK);
      await nextTick();

      // Locked banner must be present
      const lockedBanner = wrapper.find("[data-testid='permalink-edit-locked-banner']");
      expect(lockedBanner.exists()).toBe(true);

      // Save button must be disabled
      const saveBtn = wrapper.find("[data-testid='permalink-edit-save']");
      expect(saveBtn.attributes("disabled")).toBeDefined();
    });

    it("does not call updateById when Save is clicked on a published permalink", async () => {
      const wrapper = mountDialog(PUBLISHED_PERMALINK);
      await nextTick();

      const saveBtn = wrapper.find("[data-testid='permalink-edit-save']");
      await saveBtn.trigger("click");
      await nextTick();

      expect(updateByIdMock).not.toHaveBeenCalled();
    });
  });

  describe("(d) slug 409 — shows conflict error on slug field only", () => {
    it("shows a slug conflict error on a 409 response", async () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 409 },
      };
      updateByIdMock.mockRejectedValueOnce(axiosError);

      // Patch isAxiosError so the component can detect it
      vi.doMock("axios", () => ({
        isAxiosError: (e: unknown) => !!(e as Record<string, unknown>).isAxiosError,
      }));

      const wrapper = mountDialog(PRESENTATION_PERMALINK);
      await nextTick();

      // Click Save (slug is pre-filled)
      const saveBtn = wrapper.find("[data-testid='permalink-edit-save']");
      await saveBtn.trigger("click");
      await nextTick();
      await nextTick();

      // Slug conflict error should be shown
      const slugError = wrapper.find("[data-testid='permalink-edit-slug-error']");
      expect(slugError.exists()).toBe(true);

      // Not emitted
      expect(wrapper.emitted("updated")).toBeFalsy();
    });
  });
});
