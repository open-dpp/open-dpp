import { describe, expect, it, vi, beforeEach } from "vitest";
import { useBulkImportRunRepo } from "./bulk-import-run.repo.ts";
import apiClient from "../../lib/api-client.ts";
import { BulkImportRunStatusDto } from "@open-dpp/dto";
import type { BulkImportRunItemPaginationDto } from "@open-dpp/dto";
import type { BulkImportRunItemDto } from "@open-dpp/dto";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const mocks = vi.hoisted(() => {
  return {
    getRunsForConfig: vi.fn(),
    getRunById: vi.fn(),
    getRunItems: vi.fn(),
    createRun: vi.fn(),
    createRunUpload: vi.fn(),
  };
});

vi.mock("../../stores/notification.ts", () => ({
  useNotificationStore: () => ({
    addSuccessNotification: vi.fn(),
    addErrorNotification: vi.fn(),
  }),
}));

vi.mock("../../stores/error.handling.ts", () => ({
  useErrorHandlingStore: () => ({
    logErrorWithNotification: vi.fn(),
  }),
}));

vi.mock("../../lib/api-client.ts", () => ({
  default: {
    dpp: {
      bulkImport: {
        getRunsForConfig: mocks.getRunsForConfig,
        getRunById: mocks.getRunById,
        getRunItems: mocks.getRunItems,
        createRun: mocks.createRun,
        createRunUpload: mocks.createRunUpload,
      },
    },
  },
}));

const mockRun = {
  id: "run-1",
  bulkImportConfigId: "config-1",
  organizationId: "org-1",
  status: BulkImportRunStatusDto.Pending,
  userId: "user-1",
  totalCount: 2,
  succeededCount: 0,
  failedCount: 0,
  startedAt: null,
  finishedAt: null,
  createdAt: new Date().toISOString(),
};

const mockRunItem: BulkImportRunItemDto = {
  id: "item-1",
  runId: "run-1",
  rowIndex: 0,
  inputData: { sku: "4711" },
  status: "created",
  passportId: "passport-1",
  externalId: "4711",
  error: null,
};

describe("useBulkImportRunRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("triggerRun", () => {
    it("creates a run with rows", async () => {
      mocks.createRun.mockResolvedValue({
        data: mockRun,
        status: 201,
      });

      const { triggerRun } = useBulkImportRunRepo();
      const result = await triggerRun("config-1", [{ sku: "4711" }]);

      expect(result).toEqual(mockRun);
      expect(apiClient.dpp.bulkImport.createRun).toHaveBeenCalledWith("config-1", {
        rows: [{ sku: "4711" }],
      });
    });

    it("handles errors and returns undefined", async () => {
      mocks.createRun.mockRejectedValue(new Error("Failed"));

      const { triggerRun } = useBulkImportRunRepo();
      const result = await triggerRun("config-1", [{ sku: "4711" }]);

      expect(result).toBeUndefined();
    });
  });

  describe("triggerRunUpload", () => {
    it("creates a run from uploaded file", async () => {
      const mockFile = new File([], "test.csv", { type: "text/csv" });
      mocks.createRunUpload.mockResolvedValue({
        data: mockRun,
        status: 201,
      });

      const { triggerRunUpload } = useBulkImportRunRepo();
      const result = await triggerRunUpload("config-1", mockFile);

      expect(result).toEqual(mockRun);
      expect(apiClient.dpp.bulkImport.createRunUpload).toHaveBeenCalledWith("config-1", mockFile);
    });

    it("handles errors and returns undefined", async () => {
      const mockFile = new File([], "test.csv", { type: "text/csv" });
      mocks.createRunUpload.mockRejectedValue(new Error("Failed"));

      const { triggerRunUpload } = useBulkImportRunRepo();
      const result = await triggerRunUpload("config-1", mockFile);

      expect(result).toBeUndefined();
    });
  });

  describe("fetchRunsForConfig", () => {
    it("fetches runs for a config", async () => {
      mocks.getRunsForConfig.mockResolvedValue({
        data: {
          paging_metadata: { cursor: null },
          result: [mockRun],
        },
        status: 200,
      });

      const { fetchRunsForConfig } = useBulkImportRunRepo();
      const result = await fetchRunsForConfig("config-1");

      expect(result).toEqual([mockRun]);
      expect(apiClient.dpp.bulkImport.getRunsForConfig).toHaveBeenCalledWith("config-1");
    });

    it("returns undefined on error", async () => {
      mocks.getRunsForConfig.mockRejectedValue(new Error("Failed"));

      const { fetchRunsForConfig } = useBulkImportRunRepo();
      const result = await fetchRunsForConfig("config-1");

      expect(result).toBeUndefined();
    });
  });

  describe("fetchRun", () => {
    it("fetches a run by id", async () => {
      mocks.getRunById.mockResolvedValue({
        data: mockRun,
        status: 200,
      });

      const { fetchRun } = useBulkImportRunRepo();
      const result = await fetchRun("run-1");

      expect(result).toEqual(mockRun);
      expect(apiClient.dpp.bulkImport.getRunById).toHaveBeenCalledWith("run-1");
    });

    it("returns undefined on error", async () => {
      mocks.getRunById.mockRejectedValue(new Error("Failed"));

      const { fetchRun } = useBulkImportRunRepo();
      const result = await fetchRun("run-1");

      expect(result).toBeUndefined();
    });
  });

  describe("fetchRunItems", () => {
    it("fetches run items", async () => {
      const mockPaginationDto: BulkImportRunItemPaginationDto = {
        paging_metadata: { cursor: null },
        result: [mockRunItem],
      };
      mocks.getRunItems.mockResolvedValue({
        data: mockPaginationDto,
        status: 200,
      });

      const { fetchRunItems } = useBulkImportRunRepo();
      const result = await fetchRunItems("run-1");

      expect(result).toEqual(mockPaginationDto);
      expect(mocks.getRunItems).toHaveBeenCalledWith("run-1", undefined);
    });

    it("fetches run items with pagination params", async () => {
      const mockPaginationDto: BulkImportRunItemPaginationDto = {
        paging_metadata: { cursor: "some-cursor" },
        result: [mockRunItem],
      };
      mocks.getRunItems.mockResolvedValue({
        data: mockPaginationDto,
        status: 200,
      });

      const { fetchRunItems } = useBulkImportRunRepo();
      const result = await fetchRunItems("run-1", { limit: 10, cursor: "some-cursor" });

      expect(result).toEqual(mockPaginationDto);
      expect(mocks.getRunItems).toHaveBeenCalledWith("run-1", {
        limit: 10,
        cursor: "some-cursor",
      });
    });

    it("returns undefined on error", async () => {
      mocks.getRunItems.mockRejectedValue(new Error("Failed"));

      const { fetchRunItems } = useBulkImportRunRepo();
      const result = await fetchRunItems("run-1");

      expect(result).toBeUndefined();
    });
  });

  describe("isConfigEditable", () => {
    it("returns true when no runs exist", async () => {
      mocks.getRunsForConfig.mockResolvedValue({
        data: {
          paging_metadata: { cursor: null },
          result: [],
        },
        status: 200,
      });

      const { isConfigEditable } = useBulkImportRunRepo();
      const result = await isConfigEditable("config-1");

      expect(result).toBe(true);
    });

    it("returns true when only completed runs exist", async () => {
      const completedRun = { ...mockRun, status: BulkImportRunStatusDto.Completed };
      mocks.getRunsForConfig.mockResolvedValue({
        data: {
          paging_metadata: { cursor: null },
          result: [completedRun],
        },
        status: 200,
      });

      const { isConfigEditable } = useBulkImportRunRepo();
      const result = await isConfigEditable("config-1");

      expect(result).toBe(true);
    });

    it("returns false when a pending run exists", async () => {
      const pendingRun = { ...mockRun, status: BulkImportRunStatusDto.Pending };
      mocks.getRunsForConfig.mockResolvedValue({
        data: {
          paging_metadata: { cursor: null },
          result: [pendingRun],
        },
        status: 200,
      });

      const { isConfigEditable } = useBulkImportRunRepo();
      const result = await isConfigEditable("config-1");

      expect(result).toBe(false);
    });

    it("returns false when a running run exists", async () => {
      const runningRun = { ...mockRun, status: BulkImportRunStatusDto.Running };
      mocks.getRunsForConfig.mockResolvedValue({
        data: {
          paging_metadata: { cursor: null },
          result: [runningRun],
        },
        status: 200,
      });

      const { isConfigEditable } = useBulkImportRunRepo();
      const result = await isConfigEditable("config-1");

      expect(result).toBe(false);
    });

    it("returns false on error", async () => {
      mocks.getRunsForConfig.mockRejectedValue(new Error("Failed"));

      const { isConfigEditable } = useBulkImportRunRepo();
      const result = await isConfigEditable("config-1");

      expect(result).toBe(false);
    });
  });
});
