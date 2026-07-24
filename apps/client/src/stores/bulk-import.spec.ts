import type { BulkImportConfigDto, BulkImportRunDto } from "@open-dpp/dto";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import { useBulkImportStore } from "./bulk-import";

const mocks = vi.hoisted(() => {
  return {
    getConfigs: vi.fn(),
    createConfig: vi.fn(),
    updateConfig: vi.fn(),
    deleteConfig: vi.fn(),
    getRunsForConfig: vi.fn(),
    createRun: vi.fn(),
    getRunById: vi.fn(),
    getRunItems: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    dpp: {
      bulkImport: mocks,
    },
  },
}));

function buildConfig(overrides: Partial<BulkImportConfigDto> = {}): BulkImportConfigDto {
  return {
    id: "config-1",
    organizationId: "org-1",
    templateId: "template-1",
    name: "ERP export",
    idField: "sku",
    submodelMappings: [],
    inputSample: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildRun(overrides: Partial<BulkImportRunDto> = {}): BulkImportRunDto {
  return {
    id: "run-1",
    bulkImportConfigId: "config-1",
    organizationId: "org-1",
    status: "pending",
    userId: "user-1",
    totalCount: 2,
    succeededCount: 0,
    failedCount: 0,
    startedAt: null,
    finishedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("bulkImportStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("fetches configs", async () => {
    const store = useBulkImportStore();
    const config = buildConfig();
    mocks.getConfigs.mockResolvedValue({ data: { result: [config] } });

    await store.fetchConfigs("template-1");

    expect(mocks.getConfigs).toHaveBeenCalledWith("template-1");
    expect(store.configs).toEqual([config]);
  });

  it("creates a config and prepends it to the list", async () => {
    const store = useBulkImportStore();
    const existing = buildConfig({ id: "config-0" });
    store.configs = [existing];
    const created = buildConfig({ id: "config-2" });
    mocks.createConfig.mockResolvedValue({ data: created });

    const result = await store.createConfig({
      templateId: "template-1",
      name: "ERP export",
      idField: "sku",
      submodelMappings: [],
    });

    expect(result).toEqual(created);
    expect(store.configs).toEqual([created, existing]);
  });

  it("updates a config in place", async () => {
    const store = useBulkImportStore();
    store.configs = [buildConfig({ id: "config-1", name: "Old name" })];
    const updated = buildConfig({ id: "config-1", name: "New name" });
    mocks.updateConfig.mockResolvedValue({ data: updated });

    await store.updateConfig("config-1", { name: "New name", idField: "sku", submodelMappings: [] });

    expect(store.configs).toEqual([updated]);
  });

  it("removes a config from the list on delete", async () => {
    const store = useBulkImportStore();
    store.configs = [buildConfig({ id: "config-1" }), buildConfig({ id: "config-2" })];
    mocks.deleteConfig.mockResolvedValue({ status: 204 });

    const result = await store.deleteConfig("config-1");

    expect(result).toBe(true);
    expect(store.configs.map((c) => c.id)).toEqual(["config-2"]);
  });

  it("returns false and keeps the list unchanged when delete fails", async () => {
    const store = useBulkImportStore();
    store.configs = [buildConfig({ id: "config-1" })];
    mocks.deleteConfig.mockRejectedValue(new Error("boom"));

    const result = await store.deleteConfig("config-1");

    expect(result).toBe(false);
    expect(store.configs.map((c) => c.id)).toEqual(["config-1"]);
  });

  it("fetches runs for a config", async () => {
    const store = useBulkImportStore();
    const run = buildRun();
    mocks.getRunsForConfig.mockResolvedValue({ data: { result: [run] } });

    await store.fetchRunsForConfig("config-1");

    expect(mocks.getRunsForConfig).toHaveBeenCalledWith("config-1");
    expect(store.configRuns).toEqual([run]);
  });

  it("triggers a run and prepends it to the config's run history", async () => {
    const store = useBulkImportStore();
    const existingRun = buildRun({ id: "run-0" });
    store.configRuns = [existingRun];
    const newRun = buildRun({ id: "run-2" });
    mocks.createRun.mockResolvedValue({ data: newRun });

    const result = await store.triggerRun("config-1", [{ sku: "4711" }]);

    expect(mocks.createRun).toHaveBeenCalledWith("config-1", { rows: [{ sku: "4711" }] });
    expect(result).toEqual(newRun);
    expect(store.configRuns).toEqual([newRun, existingRun]);
  });

  it("fetches a single run", async () => {
    const store = useBulkImportStore();
    const run = buildRun();
    mocks.getRunById.mockResolvedValue({ data: run });

    await store.fetchRun("run-1");

    expect(store.selectedRun).toEqual(run);
  });

  it("fetches run items", async () => {
    const store = useBulkImportStore();
    const item = { id: "item-1", runId: "run-1", rowIndex: 0, inputData: {}, status: "created" };
    mocks.getRunItems.mockResolvedValue({ data: { result: [item] } });

    await store.fetchRunItems("run-1");

    expect(store.runItems).toEqual([item]);
  });
});
