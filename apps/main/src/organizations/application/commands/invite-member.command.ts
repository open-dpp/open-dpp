import { Command } from "@nestjs/cqrs";

export class InviteMemberCommand extends Command<void> {
    constructor(
        public readonly organizationId: string,
        public readonly email: string,
        public readonly role: string = "member"
    ) {
        super();
    }
}
