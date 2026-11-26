import { flushPromises, mount } from "@vue/test-utils";
import PrimeVue from "primevue/config";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import BulkImportListView from "./BulkImportListView.vue";

const { config, copyToClipboard } = vi.hoisted(() => ({
  config: {
    id: "11111111-1111-4111-8111-111111111111",
    organizationId: "org-1",
    templateId: "22222222-2222-4222-8222-222222222222",
    name: "Battery import",
    idField: "sku",
    submodelMappings: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  copyToClipboard: vi.fn(),
}));

vi.mock("../../composables/copy-to-clipboard.ts", () => ({
  useCopyToClipboard: () => ({ copyToClipboard }),
}));
vi.mock("../../composables/bulk-import/bulk-import-config.repo.ts", () => ({
  useBulkImportConfigRepo: () => ({ fetchConfigs: async () => [config] }),
}));
vi.mock("../../composables/bulk-import/bulk-import-run.repo.ts", () => ({
  useBulkImportRunRepo: () => ({ isConfigEditable: async () => true }),
}));
vi.mock("../../components/bulk-import/BulkImportWizard.vue", () => ({
  default: { template: "<div />" },
}));
vi.mock("../../components/bulk-import/EditConfigDialog.vue", () => ({
  default: { template: "<div />" },
}));

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/organizations/:organizationId/integrations/bulk-import",
        name: "bulkImport",
        component: BulkImportListView,
      },
      {
        path: "/organizations/:organizationId/templates/:templateId",
        name: "template",
        component: { template: "<div />" },
      },
    ],
  });
  await router.push("/organizations/org-1/integrations/bulk-import");
  const wrapper = mount(BulkImportListView, {
    global: {
      plugins: [
        router,
        PrimeVue,
        createI18n({ legacy: false, locale: "en", messages: { en: {} } }),
      ],
      components: { DataTable, Column },
      stubs: { Button: true, Tag: true },
    },
  });
  await flushPromises();
  return { wrapper, router };
}

describe("BulkImportListView", () => {
  beforeEach(() => {
    copyToClipboard.mockReset();
  });

  it("shows the config ID and copies it on click", async () => {
    const { wrapper } = await mountView();
    const button = wrapper.get(`[data-testid="bulk-import-config-id-${config.id}"]`);

    expect(button.element.tagName).toBe("BUTTON");
    expect(button.text()).toBe(config.id);

    await button.trigger("click");

    expect(copyToClipboard).toHaveBeenCalledExactlyOnceWith(config.id);
  });

  it("links the template ID to the template of the organization in a new tab", async () => {
    const { wrapper, router } = await mountView();
    const link = wrapper.get(`[data-testid="bulk-import-template-link-${config.id}"]`);

    expect(link.text()).toBe(config.templateId);
    expect(link.attributes("href")).toBe(`/organizations/org-1/templates/${config.templateId}`);
    expect(link.attributes("target")).toBe("_blank");
    expect(link.attributes("rel")).toBe("noopener noreferrer");

    await link.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("bulkImport");
    expect(copyToClipboard).not.toHaveBeenCalled();
  });
});
