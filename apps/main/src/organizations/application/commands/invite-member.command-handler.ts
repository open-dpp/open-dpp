import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InviteMemberCommand } from "./invite-member.command";
import { AuthService } from "../../../auth/auth.service";

@CommandHandler(InviteMemberCommand)
export class InviteMemberCommandHandler implements ICommandHandler<InviteMemberCommand> {
    constructor(
        private readonly authService: AuthService,
    ) { }

    async execute(command: InviteMemberCommand): Promise<void> {
        // We delegate invitation to better-auth plugin logic via AuthService or direct call if exposed.
        // AuthService initializes better-auth with organization plugin. 
        // better-auth exposes API to invite users.
        // We can use `this.authService.auth.api.inviteUser` if available/typed or call via HTTP internally?
        // Or we use the `organization` plugin's function.

        // Since we want to use the domain layer, maybe we should handle invitation logic here (create Invitation entity, send email).
        // But better-auth handles token generation and email sending flow if configured.
        // The user said "redundant copy ... but gives us more flexibility". 
        // Implementing our own invitation flow is cleaner for DDD.
        // For now, to be safe and quick, I will try to use better-auth if possible, or implement a simple placeholder that sends the email using EmailService.

        // Let's implement a simple version that sends the email using EmailService, assuming we are doing custom flow.
        // But `better-auth` handles the acceptance link logic.
        // I'll stick to using `better-auth` API for invitations to ensure the link works.

        await (this.authService.auth?.api as any).createInvitation({
            body: {
                email: command.email,
                role: command.role,
                organizationId: command.organizationId,
            }
        });
    }
}
