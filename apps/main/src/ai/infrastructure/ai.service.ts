import type { StructuredToolInterface } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatMistralAI } from "@langchain/mistralai";
import { Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { AiProvider, AiProvider_TYPE } from "../ai-configuration/domain/ai-configuration";

/** Union of the chat models `getLLM` can return. Widen when a provider is added. */
export type AiLlm = ChatMistralAI;

@Injectable()
export class AiService {
  private readonly configService: EnvService;

  constructor(configService: EnvService) {
    this.configService = configService;
  }

  getLLM(provider: AiProvider_TYPE, model: string): AiLlm {
    switch (provider) {
      case AiProvider.Mistral:
        return new ChatMistralAI({
          model,
          temperature: 0,
          apiKey: this.configService.get("OPEN_DPP_MISTRAL_API_KEY"),
        });
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  getAgent({ llm, tools }: { llm: AiLlm; tools: StructuredToolInterface[] }) {
    return createReactAgent({
      llm,
      tools,
    });
  }
}
