import { type InvitationResponseDto, InvitationResponseSchema } from "@open-dpp/dto";
import { UsersRepository } from "../../users/infrastructure/adapters/users.repository";
import { Invitation } from "../domain/invitation";
import { OrganizationsRepository } from "../infrastructure/adapters/organizations.repository";

export class InvitationPopulateDecorator {
  private organizationName: string | undefined = undefined;
  private userName: string | undefined = undefined;
  constructor(
    private invitation: Invitation,
    private organizationRepository: OrganizationsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async populate() {
    const organization = await this.organizationRepository.findOneById(
      this.invitation.organizationId,
    );
    if (organization) {
      this.organizationName = organization.name;
    }
    const user = await this.usersRepository.findOneById(this.invitation.inviterId);
    if (user) {
      this.userName = user.name ?? undefined;
    }
    return this;
  }

  toDto(): InvitationResponseDto {
    return InvitationResponseSchema.parse(this.toPlain());
  }

  private toPlain(): Record<string, unknown> {
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
      status: this.invitation.status,
      expiresAt: this.invitation.expiresAt.toISOString(),
      organizationId: this.invitation.organizationId,
    };
  }
}
