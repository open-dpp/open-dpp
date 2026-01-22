import { Command } from "@nestjs/cqrs";
import { OrganizationRole } from "../../domain/organization-role.enum";

export class InviteMemberCommand extends Command<void> {
  constructor(
    public readonly organizationId: string,
    public readonly email: string,
    public readonly role: OrganizationRole = OrganizationRole.MEMBER,
  ) {
    super();
  }
}
