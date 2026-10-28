import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { Injectable, Logger } from "@nestjs/common";
import { Member } from "../identity/organizations/domain/member";
import { User } from "../identity/users/domain/user";
import { PassportService } from "../passports/application/services/passport.service";
import { PassportRepository } from "../passports/infrastructure/passport.repository";
import { PolicyService } from "../policy/infrastructure/policy.service";
import { UniqueProductIdentifierRepository } from "../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import { AiConfigurationService } from "./ai-configuration/infrastructure/ai-configuration.service";
import { logChatError } from "./chat-error-log";
import { AiService } from "./infrastructure/ai.service";
import { chatSubject, createPassportTool } from "./tools/passport.tool";
import { PolicyKeyList } from "@open-dpp/dto";

@Injectable()
export class ChatService {
  private readonly logger: Logger = new Logger(ChatService.name);

  private readonly aiService: AiService;
  private readonly uniqueProductIdentifierRepository: UniqueProductIdentifierRepository;
  private readonly aiConfigurationService: AiConfigurationService;
  private readonly policyService: PolicyService;
  private readonly passportRepository: PassportRepository;
  private readonly passportService: PassportService;

  constructor(
    aiService: AiService,
    uniqueProductIdentifierRepository: UniqueProductIdentifierRepository,
    aiConfigurationService: AiConfigurationService,
    policyService: PolicyService,
    passportRepository: PassportRepository,
    passportService: PassportService,
  ) {
    this.aiService = aiService;
    this.uniqueProductIdentifierRepository = uniqueProductIdentifierRepository;
    this.aiConfigurationService = aiConfigurationService;
    this.policyService = policyService;
    this.passportRepository = passportRepository;
    this.passportService = passportService;
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
    const uniqueProductIdentifier = await this.uniqueProductIdentifierRepository.findOneOrFail(
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
      PolicyKeyList.AI_TOKEN_QUOTA,
    ]);

    if (quotaCheck) {
      const error = new Error(
        `Quota exceeded: ${quotaCheck.used}/${quotaCheck.limit} tokens used.`,
      );
      error.name = "QuotaExceededError";
      throw error;
    }

    const aiConfiguration = await this.aiConfigurationService.findOneByOrganizationId(
      passport.organizationId,
    );

    if (!aiConfiguration?.isEnabled) {
      throw new Error("AI is not enabled");
    }
    const llm = this.aiService.getLLM(aiConfiguration.provider, aiConfiguration.model);
    const subject = chatSubject(user, member, passport.organizationId);
    const tools = [createPassportTool(this.passportService, passport.id, subject)];
    const agent = this.aiService.getAgent({
      llm,
      tools,
    });
    const systemPrompt =
      "You are a helpful assistant answering questions about a product passport. Use the product-passport-tool to read it.";
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

    const result = await chain.invoke(
      { input: query },
      {
        callbacks: [
          {
            handleLLMError: (err: any) => logChatError(this.logger, "LLMError", err),
            handleChainError: (err: any) => logChatError(this.logger, "Chain Error", err),
            handleLLMEnd: async (output) => {
              const generation = output.generations?.[0]?.[0];
              const usageMetadata =
                (generation as any)?.message?.usage_metadata || output.llmOutput?.tokenUsage;

              if (usageMetadata?.total_tokens) {
                this.logger.verbose(
                  `Tokens used: ${usageMetadata.total_tokens} (input: ${usageMetadata.input_tokens}, output: ${usageMetadata.output_tokens})`,
                );
                await this.policyService.incrementQuota(
                  passport.organizationId,
                  PolicyKeyList.AI_TOKEN_QUOTA,
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
