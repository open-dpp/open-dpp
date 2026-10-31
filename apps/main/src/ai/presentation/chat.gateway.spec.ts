import type { Socket } from "socket.io";
import type { PermalinkApplicationService } from "../../permalink/application/services/permalink.application.service";
import type { UniqueProductIdentifierRepository } from "../../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import type { CapturedLogs } from "../chat-logs.test-helpers";
import type { ChatService } from "../chat.service";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Logger } from "@nestjs/common";
import { CHAT_CONTENT, captureLogs } from "../chat-logs.test-helpers";
import { ChatGateway } from "./chat.gateway";

const BOT_REPLY = "The Pacemaker X2 holds 1.2 Ah.";

describe("ChatGateway", () => {
  let askAgent: Mock<ChatService["askAgent"]>;
  let gateway: ChatGateway;
  let client: Socket;
  let logs: CapturedLogs;

  beforeEach(() => {
    askAgent = vi.fn<ChatService["askAgent"]>();
    const permalinkApplicationService = {
      resolveToPassport: vi.fn(async () => ({ passport: { id: "passport-1" } })),
    } as unknown as PermalinkApplicationService;
    const uniqueProductIdentifierRepository = {
      findOneByReferencedId: vi.fn(async () => ({ uuid: "upi-1" })),
    } as unknown as UniqueProductIdentifierRepository;
    gateway = new ChatGateway(
      { askAgent } as unknown as ChatService,
      permalinkApplicationService,
      uniqueProductIdentifierRepository,
    );
    client = { data: {}, emit: vi.fn() } as unknown as Socket;
    logs = captureLogs();
  });

  afterEach(() => {
    logs.restore();
  });

  it("never logs the user's message or the bot's reply", async () => {
    askAgent.mockResolvedValue(BOT_REPLY);

    await gateway.handleMessage({ msg: CHAT_CONTENT, permalink: "permalink-1" }, client);

    expect(client.emit).toHaveBeenCalledWith("botMessage", BOT_REPLY);
    expect(logs.text()).not.toContain(CHAT_CONTENT);
    expect(logs.text()).not.toContain(BOT_REPLY);
  });

  it("logs a failing chat without the error message that quotes the chat", async () => {
    askAgent.mockRejectedValue(new Error(`Provider rejected: ${CHAT_CONTENT}`));

    await gateway.handleMessage({ msg: CHAT_CONTENT, permalink: "permalink-1" }, client);

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      "Unexpected error in chat handler: Error",
      expect.stringMatching(/^\s+at /),
    );
    expect(logs.text()).not.toContain(CHAT_CONTENT);
  });
});
