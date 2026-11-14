import type { GuestAccessService } from "../identity/guest-access/application/services/guest-access.service";
import type { MembersRepository } from "../identity/organizations/infrastructure/adapters/members.repository";
import type { User } from "../identity/users/domain/user";
import type { PassportService } from "../passports/application/services/passport.service";
import type { PassportRepository } from "../passports/infrastructure/passport.repository";
import type { PolicyService } from "../policy/infrastructure/policy.service";
import type { UniqueProductIdentifierRepository } from "../unique-product-identifier/infrastructure/unique-product-identifier.repository";
import type { AiConfigurationService } from "./ai-configuration/infrastructure/ai-configuration.service";
import type { CapturedLogs } from "./chat-logs.test-helpers";
import type { AiService } from "./infrastructure/ai.service";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { awaitAllCallbacks } from "@langchain/core/callbacks/promises";
import { RunnableLambda } from "@langchain/core/runnables";
import { Logger } from "@nestjs/common";
import { SubjectAttributes } from "../aas/domain/security/subject-attributes";
import { GuestRole, type GuestRoleType } from "../identity/guest-access/domain/guest-role.enum";
import { MemberRole, type MemberRoleType } from "../identity/organizations/domain/member-role.enum";
import { UserRole } from "../identity/users/domain/user-role.enum";
import { PassportSubjectResolver } from "../permalink/application/services/passport-subject-resolver.service";
import { AiProvider } from "./ai-configuration/domain/ai-configuration";
import { CHAT_CONTENT, captureLogs } from "./chat-logs.test-helpers";
import { ChatService } from "./chat.service";

describe("ChatService", () => {
  let chatService: ChatService;
  let logs: CapturedLogs;
  let getAgent: Mock<(options: { tools: StructuredToolInterface[] }) => unknown>;
  let toExportPlain: Mock<(subject: SubjectAttributes) => unknown>;
  // what the stubbed stores answer for the caller
  let memberRole: MemberRoleType | undefined;
  let guestRole: GuestRoleType | undefined;

  beforeEach(() => {
    memberRole = undefined;
    guestRole = undefined;
    // An agent that fails the way a provider does when it echoes the prompt back.
    const failingAgent = RunnableLambda.from((prompt: unknown) => {
      throw new Error(`Provider rejected: ${JSON.stringify(prompt)}`);
    });
    getAgent = vi.fn(() => failingAgent);
    const aiService = {
      getLLM: vi.fn(() => ({})),
      getAgent,
    } as unknown as AiService;
    const uniqueProductIdentifierRepository = {
      findOneOrFail: vi.fn(async () => ({ referenceId: "passport-1" })),
    } as unknown as UniqueProductIdentifierRepository;
    const aiConfigurationService = {
      findOneByOrganizationId: vi.fn(async () => ({
        isEnabled: true,
        provider: AiProvider.Mistral,
        model: "codestral-latest",
      })),
    } as unknown as AiConfigurationService;
    const policyService = {
      enforce: vi.fn(async () => undefined),
    } as unknown as PolicyService;
    const passportRepository = {
      findOne: vi.fn(async () => ({ id: "passport-1", organizationId: "org-1" })),
    } as unknown as PassportRepository;
    toExportPlain = vi.fn(() => ({ id: "passport-1" }));
    const passportService = {
      getExpandedProductPassport: vi.fn(async () => ({ toExportPlain })),
    } as unknown as PassportService;
    // the real resolver: the chat must read a passport like the permalink endpoints do
    const passportSubjectResolver = new PassportSubjectResolver(
      {
        findOneByUserIdAndOrganizationId: vi.fn(async (_userId: string, organizationId: string) =>
          memberRole && organizationId === "org-1" ? { role: memberRole } : null,
        ),
      } as unknown as MembersRepository,
      {
        findGuestRole: vi.fn(async (_userId: string, organizationId: string) =>
          organizationId === "org-1" ? guestRole : undefined,
        ),
      } as unknown as GuestAccessService,
    );

    chatService = new ChatService(
      aiService,
      uniqueProductIdentifierRepository,
      aiConfigurationService,
      policyService,
      passportRepository,
      passportService,
      passportSubjectResolver,
    );
    logs = captureLogs();
  });

  afterEach(() => {
    logs.restore();
  });

  it("logs a failing chain without the error message that quotes the chat", async () => {
    await expect(chatService.askAgent(CHAT_CONTENT, "upi-1", null)).rejects.toThrow(CHAT_CONTENT);
    await awaitAllCallbacks();

    expect(Logger.prototype.error).toHaveBeenCalledWith(
      "Chain Error: Error",
      expect.stringMatching(/^\s+at /),
    );
    expect(logs.text()).not.toContain(CHAT_CONTENT);
  });

  describe("what the chat may read", () => {
    const user = (role: User["role"] = UserRole.USER) => ({ id: "user-1", role }) as User;

    // The subject the tool of the agent reads the passport with
    async function subjectOfChatWith(caller: User | null): Promise<SubjectAttributes> {
      await expect(chatService.askAgent(CHAT_CONTENT, "upi-1", caller)).rejects.toThrow();
      const passportTool = getAgent.mock.calls[0][0].tools[0];
      await passportTool.invoke({});
      return toExportPlain.mock.calls[0][0];
    }

    it("is the public view without a user", async () => {
      expect(await subjectOfChatWith(null)).toEqual(
        SubjectAttributes.create({ userRole: UserRole.ANONYMOUS }),
      );
    });

    it("includes the guest role of an accepted guest", async () => {
      guestRole = GuestRole.REPAIRER;

      expect(await subjectOfChatWith(user())).toEqual(
        SubjectAttributes.create({ userRole: UserRole.USER, guestRole: GuestRole.REPAIRER }),
      );
    });

    it("is the public view for a user whose guest access is not active", async () => {
      guestRole = undefined;

      expect(await subjectOfChatWith(user())).toEqual(
        SubjectAttributes.create({ userRole: UserRole.ANONYMOUS }),
      );
    });

    it("includes the member role of a member of the passport's organization", async () => {
      memberRole = MemberRole.OWNER;

      expect(await subjectOfChatWith(user())).toEqual(
        SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.OWNER }),
      );
    });

    it("lets a member win over a guest access", async () => {
      memberRole = MemberRole.MEMBER;
      guestRole = GuestRole.REPAIRER;

      expect(await subjectOfChatWith(user())).toEqual(
        SubjectAttributes.create({ userRole: UserRole.USER, memberRole: MemberRole.MEMBER }),
      );
    });

    it("is the admin view for an instance admin", async () => {
      expect(await subjectOfChatWith(user(UserRole.ADMIN))).toEqual(
        SubjectAttributes.create({ userRole: UserRole.ADMIN }),
      );
    });
  });
});
