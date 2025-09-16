import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import { aiConfigurationFactory } from "../testing-utils/fixtures/ai-configuration.factory";
import { useAiIntegrationStore } from "./ai.integration";
import { AiConfigurationUpsertDto, AiProvider } from "@open-dpp/api-client";

const mocks = vi.hoisted(() => {
  return {
    upsert: vi.fn(),
    get: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    agentServer: {
      aiConfigurations: {
        upsert: mocks.upsert,
        get: mocks.get,
      },
    },
  },
}));

describe("AiIntegrationStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should get ai configuration", async () => {
    const aiIntegrationStore = useAiIntegrationStore();
    const configuration = aiConfigurationFactory.build();
    mocks.get.mockResolvedValue({ data: configuration });
    await aiIntegrationStore.fetchConfiguration();
    expect(aiIntegrationStore.configuration).toEqual(configuration);
  });

  it("should modify ai configuration", async () => {
    const aiIntegrationStore = useAiIntegrationStore();
    const update: AiConfigurationUpsertDto = {
      isEnabled: false,
      provider: AiProvider.Ollama,
      model: "qwen2",
    };
    const configuration = aiConfigurationFactory.build(update);
    mocks.upsert.mockResolvedValue({ data: configuration });
    await aiIntegrationStore.modifyConfiguration(update);
    expect(mocks.upsert).toHaveBeenCalledWith(update);
    expect(aiIntegrationStore.configuration).toEqual(configuration);
  });
});
