import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { Injectable, Logger } from "@nestjs/common";
import { PassportRepository } from "../passports/infrastructure/passport.repository";
import { PolicyKey } from "../policy/domain/policy";
import { PolicyService } from "../policy/infrastructure/policy.service";
import {
  UniqueProductIdentifierApplicationService,
} from "../unique-product-identifier/presentation/unique.product.identifier.application.service";
import { AiConfigurationService } from "./ai-configuration/infrastructure/ai-configuration.service";
import { AiService } from "./infrastructure/ai.service";
import { McpClientService } from "./mcp-client/mcp-client.service";

@Injectable()
export class ChatService {
  private readonly logger: Logger = new Logger(ChatService.name);

  private mcpClientService: McpClientService;
  private aiService: AiService;
  private uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService;
  private aiConfigurationService: AiConfigurationService;
  private policyService: PolicyService;
  private passportRepository: PassportRepository;

  constructor(
    mcpClientService: McpClientService,
    aiService: AiService,
    uniqueProductIdentifierApplicationService: UniqueProductIdentifierApplicationService,
    aiConfigurationService: AiConfigurationService,
    policyService: PolicyService,
    passportRepository: PassportRepository,
  ) {
    this.mcpClientService = mcpClientService;
    this.aiService = aiService;
    this.uniqueProductIdentifierApplicationService = uniqueProductIdentifierApplicationService;
    this.aiConfigurationService = aiConfigurationService;
    this.policyService = policyService;
    this.passportRepository = passportRepository;
  }

  async askAgent(query: string, passportUuid: string) {
    this.logger.log(`Find passport with UUID: ${passportUuid}`);
    const passport = await this.passportRepository.findOne(passportUuid);
    if (!passport) {
      throw new Error(`Product passport with id ${passportUuid} not found`);
    }
    if (!passport) {
      throw new Error("Passport not found");
    }

    // Check quota BEFORE processing
    const quotaCheck = await this.policyService.enforce(
      passport.organizationId,
      [PolicyKey.AI_TOKEN_QUOTA],
    );

    if (quotaCheck) {
      const error = new Error(`Quota exceeded: ${quotaCheck.used}/${quotaCheck.limit} tokens used.`);
      error.name = "QuotaExceededError";
      throw error;
    }

    this.logger.log(`Fetch ai configuration`);
    const aiConfiguration
      = await this.aiConfigurationService.findOneByOrganizationId(
        passport.organizationId,
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
    const agent = this.aiService.getAgent({
      llm,
      tools,
    });
    const systemPrompt = `You are a helpful assistant. The current product passport has the passportId: <${passportUuid}>`;
    this.logger.log(systemPrompt);
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        systemPrompt,
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

    const result = await chain.invoke({ input: query }, {
      callbacks: [
        {
          handleLLMEnd: async (output) => {
            const generation = output.generations?.[0]?.[0];
            const usageMetadata = (generation as any)?.message?.usage_metadata || output.llmOutput?.tokenUsage;

            if (usageMetadata?.total_tokens) {
              this.logger.debug(`Tokens used: ${usageMetadata.total_tokens} (input: ${usageMetadata.input_tokens}, output: ${usageMetadata.output_tokens})`);
              await this.policyService.incrementQuota(
                passport.organizationId,
                PolicyKey.AI_TOKEN_QUOTA,
                usageMetadata.total_tokens,
              );
            }
            else {
              this.logger.warn("No token usage information available");
            }
          },
        },
      ],
    });

    return result;
  }
}
