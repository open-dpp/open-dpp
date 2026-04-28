import { Invitation } from "../domain/invitation";
import { OrganizationsRepository } from "../infrastructure/adapters/organizations.repository";
import { UsersService } from "../../users/application/services/users.service";

export class InvitationPopulateDecorator {
  private organizationName: string | undefined = undefined;
  private userName: string | undefined = undefined;
  constructor(
    private invitation: Invitation,
    private organizationRepository: OrganizationsRepository,
    private usersService: UsersService,
  ) {}

  async populate() {
    const organization = await this.organizationRepository.findOneById(
      this.invitation.organizationId,
    );
    if (organization) {
      this.organizationName = organization.name;
    }
    const user = await this.usersService.findOne(this.invitation.inviterId);
    if (user) {
      this.userName = user.name ?? undefined;
    }
    return this;
  }

  toPlain(): Record<string, any> {
    return {
      id: this.invitation.id,
      ...(this.organizationName
        ? {
            organization: {
              name: this.organizationName,
            },
          }
        : {}),
      ...(this.userName
        ? {
            inviter: {
              name: this.userName,
            },
          }
        : {}),
      expiresAt: this.invitation.expiresAt.toISOString(),
    };
  }
}
