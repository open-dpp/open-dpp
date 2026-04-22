import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { Injectable, Logger } from "@nestjs/common";
import { Member } from "../identity/organizations/domain/member";
import { User } from "../identity/users/domain/user";
import { PassportRepository } from "../passports/infrastructure/passport.repository";
import { PolicyKey } from "../policy/domain/policy";
import { PolicyService } from "../policy/infrastructure/policy.service";
import { UniqueProductIdentifierRepository } from "../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { AiConfigurationService } from "./ai-configuration/infrastructure/ai-configuration.service";
import { AiService } from "./infrastructure/ai.service";
import { McpClientService } from "./mcp-client/mcp-client.service";

@Injectable()
export class ChatService {
  private readonly logger: Logger = new Logger(ChatService.name);

  private readonly mcpClientService: McpClientService;
  private readonly aiService: AiService;
  private readonly uniqueProductIdentifierService: UniqueProductIdentifierRepository;
  private readonly aiConfigurationService: AiConfigurationService;
  private readonly policyService: PolicyService;
  private readonly passportRepository: PassportRepository;

  constructor(
    mcpClientService: McpClientService,
    aiService: AiService,
    uniqueProductIdentifierService: UniqueProductIdentifierRepository,
    aiConfigurationService: AiConfigurationService,
    policyService: PolicyService,
    passportRepository: PassportRepository,
  ) {
    this.mcpClientService = mcpClientService;
    this.aiService = aiService;
    this.uniqueProductIdentifierService = uniqueProductIdentifierService;
    this.aiConfigurationService = aiConfigurationService;
    this.policyService = policyService;
    this.passportRepository = passportRepository;
  }

  async askAgent(
    query: string,
    uniqueProductIdentifierUuid: string,
    user: User | null,
    member: Member | null,
  ) {
    this.logger.log(
      `Resolve passport from UniqueProductIdentifier: ${uniqueProductIdentifierUuid}`,
    );
    const uniqueProductIdentifier = await this.uniqueProductIdentifierService.findOneOrFail(
      uniqueProductIdentifierUuid,
    );
    const passport = await this.passportRepository.findOne(uniqueProductIdentifier.referenceId);
    if (!passport) {
      throw new Error(
        `Product passport for UniqueProductIdentifier ${uniqueProductIdentifierUuid} not found`,
      );
    }

    // Check quota BEFORE processing
    const quotaCheck = await this.policyService.enforce(passport.organizationId, [
      PolicyKey.AI_TOKEN_QUOTA,
    ]);

    if (quotaCheck) {
      const error = new Error(
        `Quota exceeded: ${quotaCheck.used}/${quotaCheck.limit} tokens used.`,
      );
      error.name = "QuotaExceededError";
      throw error;
    }

    this.logger.log(`Fetch ai configuration`);
    const aiConfiguration = await this.aiConfigurationService.findOneByOrganizationId(
      passport.organizationId,
    );

    if (!aiConfiguration?.isEnabled) {
      this.logger.log(`AI is not enabled`);
      throw new Error("AI is not enabled");
    }
    this.logger.log(`Get llm`);

    const llm = this.aiService.getLLM(aiConfiguration.provider, aiConfiguration.model);
    this.logger.log(`Get tools`);
    const tools = await this.mcpClientService.getTools({ user, member });
    const agent = this.aiService.getAgent({
      llm,
      tools,
    });
    const systemPrompt = `You are a helpful assistant. The current product passport has the passportId: <${passport.id}>.`;
    this.logger.log(systemPrompt);
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["human", "{input}"],
    ]);

    const chain = RunnableSequence.from([
      prompt,
      agent,
      (agentResponse: { messages: any[] }) => {
        const messages = agentResponse.messages || [];
        const lastMessage = messages.at(-1);

        return lastMessage?.content || "";
      },
      new StringOutputParser(),
    ]);
    this.logger.log(`Ask agent`);

    const errorFunc = (type: string, err: any) => {
      console.error(type, err);
    };
    const result = await chain.invoke(
      { input: query },
      {
        callbacks: [
          {
            handleLLMError: (err: any) => errorFunc("LLMError", err),
            handleChainError: (err: any) => errorFunc("Chain Error", err),
            handleLLMEnd: async (output) => {
              const generation = output.generations?.[0]?.[0];
              const usageMetadata =
                (generation as any)?.message?.usage_metadata || output.llmOutput?.tokenUsage;
              this.logger.log(`In asking`);

              if (usageMetadata?.total_tokens) {
                this.logger.debug(
                  `Tokens used: ${usageMetadata.total_tokens} (input: ${usageMetadata.input_tokens}, output: ${usageMetadata.output_tokens})`,
                );
                await this.policyService.incrementQuota(
                  passport.organizationId,
                  PolicyKey.AI_TOKEN_QUOTA,
                  usageMetadata.total_tokens,
                );
              } else {
                this.logger.warn("No token usage information available");
              }
            },
          },
        ],
      },
    );

    return result;
  }
}
