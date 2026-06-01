import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePresentationConfigurationStore } from "./presentation-configuration";

function makeNamespace() {
  return {
    list: vi.fn().mockResolvedValue({
      data: [
        {
          id: "c1",
          organizationId: "org-1",
          referenceId: "p-1",
          referenceType: "passport",
          label: null,
          elementDesign: {},
          defaultComponents: {},
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "c2",
          organizationId: "org-1",
          referenceId: "p-1",
          referenceType: "passport",
          label: "Variant A",
          elementDesign: {},
          defaultComponents: {},
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    }),
    patchById: vi.fn().mockImplementation((_id, configId, body) =>
      Promise.resolve({
        data: {
          id: configId,
          organizationId: "org-1",
          referenceId: "p-1",
          referenceType: "passport",
          label: configId === "c1" ? null : "Variant A",
          elementDesign: body.elementDesign ?? {},
          defaultComponents: body.defaultComponents ?? {},
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        },
      }),
    ),
  };
}

const errorHandlingStore = { logErrorWithNotification: vi.fn() };
const t = (k: string) => k;

beforeEach(() => setActivePinia(createPinia()));

describe("usePresentationConfigurationStore", () => {
  it("fetches the list and exposes configs ordered by createdAt", async () => {
    const store = usePresentationConfigurationStore();
    const ns = makeNamespace();
    await store.fetch({
      referenceId: "p-1",
      namespace: ns as any,
      errorHandlingStore,
      translate: t,
    });
    expect(store.configs).toHaveLength(2);
    expect(store.configs[0]?.id).toBe("c1");
  });

  it("activeConfig defaults to first when no activeConfigId is set", async () => {
    const store = usePresentationConfigurationStore();
    const ns = makeNamespace();
    await store.fetch({
      referenceId: "p-1",
      namespace: ns as any,
      errorHandlingStore,
      translate: t,
    });
    expect(store.activeConfig?.id).toBe("c1");
  });

  it("activeConfig respects activeConfigId when set to a known id", async () => {
    const store = usePresentationConfigurationStore();
    const ns = makeNamespace();
    await store.fetch({
      referenceId: "p-1",
      namespace: ns as any,
      errorHandlingStore,
      translate: t,
    });
    store.setActiveConfigId("c2");
    expect(store.activeConfig?.id).toBe("c2");
  });

  it("activeConfig falls back to first when activeConfigId is unknown", async () => {
    const store = usePresentationConfigurationStore();
    const ns = makeNamespace();
    await store.fetch({
      referenceId: "p-1",
      namespace: ns as any,
      errorHandlingStore,
      translate: t,
    });
    store.setActiveConfigId("nonexistent");
    expect(store.activeConfig?.id).toBe("c1");
  });

  it("setElementDesign patches the active config and updates state", async () => {
    const store = usePresentationConfigurationStore();
    const ns = makeNamespace();
    await store.fetch({
      referenceId: "p-1",
      namespace: ns as any,
      errorHandlingStore,
      translate: t,
    });
    await store.setElementDesign("submodel.foo", "BigNumber");
    expect(ns.patchById).toHaveBeenCalledWith("p-1", "c1", {
      elementDesign: { "submodel.foo": "BigNumber" },
    });
    expect(store.activeConfig?.elementDesign["submodel.foo"]).toBe("BigNumber");
  });

  it("removeElementDesign sends null in the patch", async () => {
    const store = usePresentationConfigurationStore();
    const ns = makeNamespace();
    await store.fetch({
      referenceId: "p-1",
      namespace: ns as any,
      errorHandlingStore,
      translate: t,
    });
    await store.removeElementDesign("submodel.foo");
    expect(ns.patchById).toHaveBeenCalledWith("p-1", "c1", {
      elementDesign: { "submodel.foo": null },
    });
  });

  it("$reset clears configs, activeConfigId, and bound deps", async () => {
    const store = usePresentationConfigurationStore();
    const ns = makeNamespace();
    await store.fetch({
      referenceId: "p-1",
      namespace: ns as any,
      errorHandlingStore,
      translate: t,
    });
    store.setActiveConfigId("c2");
    store.$reset();
    expect(store.configs).toEqual([]);
    expect(store.activeConfigId).toBeNull();
    expect(store.activeConfig).toBeNull();
  });
});
