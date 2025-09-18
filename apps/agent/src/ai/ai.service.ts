import { Injectable } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { StructuredToolInterface } from '@langchain/core/tools';
import { ConfigService } from '@nestjs/config';
import { ChatMistralAI } from '@langchain/mistralai';
import { AiProvider } from '../ai-configuration/domain/ai-configuration';

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  getLLM(aiModel: AiProvider, model: string) {
    if (aiModel === AiProvider.Mistral) {
      return new ChatMistralAI({
        model,
        temperature: 0,
        apiKey: this.configService.get('MISTRAL_API_KEY'),
      });
    }

    return new ChatOllama({
      model,
      baseUrl: this.configService.get('OLLAMA_URL'),
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
