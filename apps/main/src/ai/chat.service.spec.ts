import { describe, expect, it, jest } from "@jest/globals";
import { NotFoundError } from "@open-dpp/exception";
import { ChatService } from "./chat.service";

describe("ChatService.askAgent (resolves the passport directly)", () => {
  it("resolves the passport by passportId and throws when it is missing — no UPI lookup", async () => {
    const findOne = jest.fn<any>().mockResolvedValue(undefined);
    const service = new ChatService(
      {} as never, // mcpClientService
      {} as never, // aiService
      {} as never, // aiConfigurationService
      {} as never, // policyService
      { findOne } as never, // passportRepository
    );

    const result = service.askAgent("hi", "passport-1", null, null);
    await expect(result).rejects.toThrow(NotFoundError);
    await expect(result).rejects.toThrow("Product passport passport-1 not found");
    expect(findOne).toHaveBeenCalledWith("passport-1");
  });
});
