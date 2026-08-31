import type { StructuredToolInterface } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatMistralAI } from "@langchain/mistralai";
import { Injectable } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { AiProvider_TYPE } from "../ai-configuration/domain/ai-configuration";

@Injectable()
export class AiService {
  private readonly configService: EnvService;

  constructor(configService: EnvService) {
    this.configService = configService;
  }

  getLLM(aiModel: AiProvider_TYPE, model: string) {
    return new ChatMistralAI({
      model,
      temperature: 0,
      apiKey: this.configService.get("OPEN_DPP_MISTRAL_API_KEY"),
    });
  }

  getAgent({ llm, tools }: { llm: ChatMistralAI; tools: StructuredToolInterface[] }) {
    return createReactAgent({
      llm,
      tools,
    });
  }
}
