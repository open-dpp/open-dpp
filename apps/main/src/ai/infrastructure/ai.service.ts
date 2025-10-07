import type { StructuredToolInterface } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatOllama } from "@langchain/ollama";
import { Injectable } from "@nestjs/common";
import { AiProvider } from "@open-dpp/api-client";
import { EnvService } from "@open-dpp/env";
import { AiProvider_TYPE } from "../ai-configuration/domain/ai-configuration";

@Injectable()
export class AiService {
  private readonly configService: EnvService;

  constructor(configService: EnvService) {
    this.configService = configService;
  }

  getLLM(aiModel: AiProvider_TYPE, model: string) {
    if (aiModel === AiProvider.Mistral) {
      return new ChatMistralAI({
        model,
        temperature: 0,
        apiKey: this.configService.get("OPEN_DPP_MISTRAL_API_KEY"),
      });
    }

    return new ChatOllama({
      model,
      baseUrl: this.configService.get("OPEN_DPP_OLLAMA_URL"),
    });
  }

  getAgent({
    llm,
    tools,
  }: {
    llm: ChatOllama | ChatMistralAI;
    tools: StructuredToolInterface[];
  }) {
    return createReactAgent({
      llm,
      tools,
    });
  }
}
