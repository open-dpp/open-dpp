// agent-server/src/chat.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { AiService } from './ai/ai.service';
import { McpClientService } from './mcp-client/mcp-client.service';
import { AiConfigurationService } from './ai-configuration/infrastructure/ai-configuration.service';
import { PassportService } from './passports/passport.service';

@Injectable()
export class ChatService {
  private readonly logger: Logger = new Logger(ChatService.name);

  constructor(
    private mcpClientService: McpClientService,
    private aiService: AiService,
    private passportService: PassportService,
    private aiConfigurationService: AiConfigurationService,
  ) {}

  async askAgent(query: string, passportUuid: string) {
    this.logger.log(`Find passport with UUID: ${passportUuid}`);
    const passport = await this.passportService.findOneOrFail(passportUuid);
    if (!passport) {
      throw new Error('Passport not found');
    }
    this.logger.log(`Fetch ai configuration`);
    const aiConfiguration =
      await this.aiConfigurationService.findOneByOrganizationId(
        passport.ownedByOrganizationId,
      );

    if (!aiConfiguration?.isEnabled) {
      this.logger.log(`AI is not enabled`);
      throw new Error('AI is not enabled');
    }
    this.logger.log(`Get llm`);

    const llm = this.aiService.getLLM(
      aiConfiguration.provider,
      aiConfiguration.model,
    );
    this.logger.log(`Get tools`);
    const tools = await this.mcpClientService.getTools();
    this.logger.log(`Get agent with llm and tools`);
    const agent = this.aiService.getAgent({
      llm,
      tools,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a helpful assistant. The current product passport has the UUID: ${passportUuid}`,
      ],
      ['human', '{input}'],
    ]);

    const chain = RunnableSequence.from([
      prompt,
      agent,
      (agentResponse: { messages: any[] }) => {
        const messages = agentResponse.messages || [];
        const lastMessage = messages[messages.length - 1];

        return lastMessage?.content || '';
      },
      new StringOutputParser(),
    ]);
    this.logger.log(`Ask agent`);

    return await chain.invoke({ input: query });
  }
}
