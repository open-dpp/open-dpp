import type { PassportService } from "../passports/application/services/passport.service";
import type { PassportRepository } from "../passports/infrastructure/passport.repository";
import type { PolicyService } from "../policy/infrastructure/policy.service";
import type { UniqueProductIdentifierRepository } from "../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import type { AiConfigurationService } from "./ai-configuration/infrastructure/ai-configuration.service";
import type { CapturedLogs } from "./chat-logs.test-helpers";
import type { AiService } from "./infrastructure/ai.service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { awaitAllCallbacks } from "@langchain/core/callbacks/promises";
import { RunnableLambda } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import { AiProvider } from "./ai-configuration/domain/ai-configuration";
import { CHAT_CONTENT, captureLogs } from "./chat-logs.test-helpers";
import { ChatService } from "./chat.service";

describe("ChatService", () => {
  let chatService: ChatService;
  let logs: CapturedLogs;

  beforeEach(() => {
    // An agent that fails the way a provider does when it echoes the prompt back.
    const failingAgent = RunnableLambda.from((prompt: unknown) => {
      throw new Error(`Provider rejected: ${JSON.stringify(prompt)}`);
    });
    const aiService = {
      getLLM: vi.fn(() => ({})),
      getAgent: vi.fn(() => failingAgent),
    } as unknown as AiService;
    const uniqueProductIdentifierRepository = {
      findOneOrFail: vi.fn(async () => ({ referenceId: "passport-1" })),
    } as unknown as UniqueProductIdentifierRepository;
    const aiConfigurationService = {
      findOneByOrganizationId: vi.fn(async () => ({
        isEnabled: true,
        provider: AiProvider.Mistral,
        model: "codestral-latest",
      })),
    } as unknown as AiConfigurationService;
    const policyService = {
      enforce: vi.fn(async () => undefined),
    } as unknown as PolicyService;
    const passportRepository = {
      findOne: vi.fn(async () => ({ id: "passport-1", organizationId: "org-1" })),
    } as unknown as PassportRepository;

    chatService = new ChatService(
      aiService,
      uniqueProductIdentifierRepository,
      aiConfigurationService,
      policyService,
      passportRepository,
      {} as PassportService,
    );
    logs = captureLogs();
  });

  afterEach(() => {
    logs.restore();
  });

  it("logs a failing chain without the error message that quotes the chat", async () => {
    await expect(chatService.askAgent(CHAT_CONTENT, "upi-1", null, null)).rejects.toThrow(
      CHAT_CONTENT,
    );
    await awaitAllCallbacks();

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      "Chain Error: Error",
      expect.stringMatching(/^\s+at /),
    );
    expect(logs.text()).not.toContain(CHAT_CONTENT);
  });
});
