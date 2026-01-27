import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AuthService } from "../../../auth/application/services/auth.service";
import { InviteMemberCommand } from "./invite-member.command";

interface CreateInvitationParams {
  headers?: Record<string, string> | Headers;
  body: {
    email: string;
    role: string;
    organizationId: string;
  };
}

interface OrganizationAuthApi {
  createInvitation: (params: CreateInvitationParams) => Promise<any>;
}

@CommandHandler(InviteMemberCommand)
export class InviteMemberCommandHandler implements ICommandHandler<InviteMemberCommand> {
  constructor(
    private readonly authService: AuthService,
  ) { }

  async execute(command: InviteMemberCommand): Promise<void> {
    if (!this.authService.auth) {
      throw new Error("Auth service is not initialized");
    }

    const api = this.authService.auth.api as unknown as OrganizationAuthApi;

    if (typeof api.createInvitation !== "function") {
      throw new TypeError("createInvitation method is not available on auth api. Check if organization plugin is enabled.");
    }

    await api.createInvitation({
      headers: command.headers,
      body: {
        email: command.email,
        role: command.role,
        organizationId: command.organizationId,
      },
    });
  }
}
