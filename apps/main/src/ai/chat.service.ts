import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { Injectable, Logger } from "@nestjs/common";
import { AiConfigurationService } from "./ai-configuration/infrastructure/ai-configuration.service";
import { AiService } from "./ai.service";
import { McpClientService } from "./mcp-client/mcp-client.service";
import { PassportService } from "./passports/passport.service";

@Injectable()
export class ChatService {
  private readonly logger: Logger = new Logger(ChatService.name);

  private mcpClientService: McpClientService;
  private aiService: AiService;
  private passportService: PassportService;
  private aiConfigurationService: AiConfigurationService;

  constructor(
    mcpClientService: McpClientService,
    aiService: AiService,
    passportService: PassportService,
    aiConfigurationService: AiConfigurationService,
  ) {
    this.mcpClientService = mcpClientService;
    this.aiService = aiService;
    this.passportService = passportService;
    this.aiConfigurationService = aiConfigurationService;
  }

  async askAgent(query: string, passportUuid: string) {
    this.logger.log(`Find passport with UUID: ${passportUuid}`);
    const passport = await this.passportService.findOneOrFail(passportUuid);
    if (!passport) {
      throw new Error("Passport not found");
    }
    this.logger.log(`Fetch ai configuration`);
    const aiConfiguration
      = await this.aiConfigurationService.findOneByOrganizationId(
        passport.ownedByOrganizationId,
      );

    if (!aiConfiguration?.isEnabled) {
      this.logger.log(`AI is not enabled`);
      throw new Error("AI is not enabled");
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
        "system",
        `You are a helpful assistant. The current product passport has the UUID: ${passportUuid}`,
      ],
      ["human", "{input}"],
    ]);

    const chain = RunnableSequence.from([
      prompt,
      agent,
      (agentResponse: { messages: any[] }) => {
        const messages = agentResponse.messages || [];
        const lastMessage = messages[messages.length - 1];

        return lastMessage?.content || "";
      },
      new StringOutputParser(),
    ]);
    this.logger.log(`Ask agent`);

    return await chain.invoke({ input: query });
  }
}
