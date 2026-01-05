import { templatesPlainFactory } from "@open-dpp/testing";
import { createPinia, setActivePinia } from "pinia";
import { it, vi } from "vitest";
import { useTemplatesStore } from "./templates.ts";

const mocks = vi.hoisted(() => {
  return {
    createTemplate: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templates: {
        create: mocks.createTemplate,
      },
    },
  },
}));

describe("templates", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should merge data values with form data", async () => {
    const templatesStore = useTemplatesStore();
    mocks.createTemplate.mockResolvedValueOnce({ data: templatesPlainFactory.build() });
    // await templatesStore.createTemplate();
    // expect(mocks.createTemplate).toHaveBeenCalledWith();
  });
});
