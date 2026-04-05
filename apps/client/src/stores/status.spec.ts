import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStatusStore } from "./status";

const mocks = vi.hoisted(() => {
  return {
    get: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    status: {
      get: mocks.get,
    },
  },
}));

describe("statusStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should have version as null initially", () => {
    const statusStore = useStatusStore();
    expect(statusStore.version).toBeNull();
  });

  it("should set version on successful fetch", async () => {
    const statusStore = useStatusStore();
    mocks.get.mockResolvedValueOnce({ data: { version: "1.0.0" } });
    await statusStore.fetchStatus();
    expect(statusStore.version).toBe("1.0.0");
    expect(mocks.get).toHaveBeenCalledOnce();
  });

  it("should leave version as null when fetch fails", async () => {
    const statusStore = useStatusStore();
    mocks.get.mockRejectedValueOnce(new Error("Network error"));
    await statusStore.fetchStatus();
    expect(statusStore.version).toBeNull();
  });
});
