import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { StructuredToolInterface } from '@langchain/core/tools';
import { ChatMistralAI } from '@langchain/mistralai';
import { AiProvider } from '../domain/ai-configuration';
import { EnvService } from '@app/env/env.service';

@Injectable()
export class AiService {
  constructor(private readonly configService: EnvService) {}

  getLLM(aiModel: AiProvider, model: string) {
    if (aiModel === AiProvider.Mistral) {
      return new ChatMistralAI({
        model,
        temperature: 0,
        apiKey: this.configService.get('OPEN_DPP_MISTRAL_API_KEY'),
      });
    }

    return new ChatOllama({
      model,
      baseUrl: this.configService.get('OPEN_DPP_OLLAMA_URL'),
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
