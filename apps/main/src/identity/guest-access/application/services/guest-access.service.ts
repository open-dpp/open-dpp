import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { DisplayLanguageType } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException, ValueError } from "@open-dpp/exception";
import { InviteGuestMail } from "../../../../email/domain/invite-guest-mail";
import { EmailService } from "../../../../email/email.service";
import { MembersService } from "../../../organizations/application/services/members.service";
import { OrganizationsRepository } from "../../../organizations/infrastructure/adapters/organizations.repository";
import { User } from "../../../users/domain/user";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { DirectGuestAccess } from "../../domain/direct-guest-access";
import { GuestAccess } from "../../domain/guest-access";
import { GuestRole, GuestRoleType } from "../../domain/guest-role.enum";
import { GuestAccessRepository } from "../../infrastructure/adapters/guest-access.repository";

const GUEST_ROLE_NAME_BY_LANGUAGE: Record<DisplayLanguageType, Record<GuestRoleType, string>> = {
  en: {
    [GuestRole.REPAIRER]: "Repairer",
    [GuestRole.RECYCLER]: "Recycler",
    [GuestRole.MARKET_SURVEILLANCE]: "Market surveillance authority",
    [GuestRole.INDEPENDENT_OPERATOR]: "Independent operator",
    [GuestRole.SUPPLIER]: "Supplier",
  },
  de: {
    [GuestRole.REPAIRER]: "Reparateur",
    [GuestRole.RECYCLER]: "Recycler",
    [GuestRole.MARKET_SURVEILLANCE]: "Marktüberwachungsbehörde",
    [GuestRole.INDEPENDENT_OPERATOR]: "Unabhängiger Wirtschaftsakteur",
    [GuestRole.SUPPLIER]: "Lieferant",
  },
};

@Injectable()
export class GuestAccessService {
  private readonly logger = new Logger(GuestAccessService.name);

  constructor(
    private readonly guestAccessRepository: GuestAccessRepository,
    private readonly membersService: MembersService,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly envService: EnvService,
  ) {}

  /**
   * Invites a person by email. The access grants nothing until the invited person accepts it. The
   * result never says whether the email belongs to an account.
   */
  async invite(data: {
    organizationId: string;
    actingUserId: string;
    email: string;
    guestRole: GuestRoleType;
  }): Promise<GuestAccess> {
    await this.ensureOwnerOrFail(data.organizationId, data.actingUserId);
    const guestAccess = DirectGuestAccess.create({
      organizationId: data.organizationId,
      email: data.email,
      guestRole: data.guestRole,
      grantedBy: data.actingUserId,
    });

    const members = await this.membersService.getMembers(data.organizationId);
    if (members.some((member) => member.user?.email.toLowerCase() === guestAccess.email)) {
      throw new ValueError("This person is already a member of the organization");
    }
    const existing = await this.guestAccessRepository.findAllByOrganizationId(data.organizationId, {
      email: guestAccess.email,
      revoked: false,
    });
    if (existing.length > 0) {
      throw new ValueError("A guest access for this email already exists");
    }

    const saved = await this.guestAccessRepository.save(guestAccess);
    await this.sendInvitation(saved, guestAccess.email, data.actingUserId);
    return saved;
  }

  async list(organizationId: string, actingUserId: string): Promise<GuestAccess[]> {
    await this.ensureOwnerOrFail(organizationId, actingUserId);
    return await this.guestAccessRepository.findAllByOrganizationId(organizationId);
  }

  /**
   * The invited person accepts with an account whose verified email matches the invitation. From
   * then on the access is bound to that account.
   */
  async accept(guestAccessId: string, user: User): Promise<GuestAccess> {
    const guestAccess = await this.guestAccessRepository.findOneByIdOrFail(guestAccessId);
    if (!(guestAccess instanceof DirectGuestAccess)) {
      throw new ValueError("This guest access cannot be accepted");
    }
    if (await this.membersService.isMemberOfOrganization(user.id, guestAccess.organizationId)) {
      throw new ValueError("Members of the organization cannot accept a guest access");
    }
    const accepted = await this.guestAccessRepository.findAllByOrganizationId(
      guestAccess.organizationId,
      { acceptedByUserId: user.id, revoked: false },
    );
    if (accepted.length > 0) {
      throw new ValueError("You already have a guest access in this organization");
    }
    guestAccess.accept(user, new Date());
    return await this.guestAccessRepository.save(guestAccess);
  }

  async changeGuestRole(data: {
    organizationId: string;
    guestAccessId: string;
    actingUserId: string;
    guestRole: GuestRoleType;
  }): Promise<GuestAccess> {
    await this.ensureOwnerOrFail(data.organizationId, data.actingUserId);
    const guestAccess = await this.findInOrganizationOrFail(
      data.organizationId,
      data.guestAccessId,
    );
    if (!(guestAccess instanceof DirectGuestAccess)) {
      throw new ValueError("The role of this guest access cannot be changed");
    }
    guestAccess.changeGuestRole(data.guestRole);
    return await this.guestAccessRepository.save(guestAccess);
  }

  async revoke(data: {
    organizationId: string;
    guestAccessId: string;
    actingUserId: string;
  }): Promise<GuestAccess> {
    await this.ensureOwnerOrFail(data.organizationId, data.actingUserId);
    const guestAccess = await this.findInOrganizationOrFail(
      data.organizationId,
      data.guestAccessId,
    );
    guestAccess.revoke(new Date());
    return await this.guestAccessRepository.save(guestAccess);
  }

  /**
   * The guest role a user has in an organization, if any. Whoever resolves a subject checks the
   * membership first: a member never acts as a guest.
   */
  async findGuestRole(userId: string, organizationId: string): Promise<GuestRoleType | undefined> {
    const candidates = await this.guestAccessRepository.findAllByOrganizationId(organizationId, {
      acceptedByUserId: userId,
      revoked: false,
    });
    return candidates.find((guestAccess) => guestAccess.isActiveFor({ userId }))?.guestRole;
  }

  private async ensureOwnerOrFail(organizationId: string, userId: string): Promise<void> {
    if (!(await this.membersService.isOwnerOrAdmin(organizationId, userId))) {
      throw new ForbiddenException("Only owners can manage guest access");
    }
  }

  // An access of another organization is reported as missing, not as forbidden.
  private async findInOrganizationOrFail(
    organizationId: string,
    guestAccessId: string,
  ): Promise<GuestAccess> {
    const guestAccess = await this.guestAccessRepository.findOneByIdOrFail(guestAccessId);
    if (guestAccess.organizationId !== organizationId) {
      throw new NotFoundInDatabaseException(DirectGuestAccess.name);
    }
    return guestAccess;
  }

  // The mail is sent in the language of the inviting owner, since the invitee may not have an account.
  private async sendInvitation(
    guestAccess: GuestAccess,
    email: string,
    invitedBy: string,
  ): Promise<void> {
    try {
      const organization = await this.organizationsRepository.findOneById(
        guestAccess.organizationId,
      );
      const inviter = await this.usersRepository.findOneById(invitedBy);
      const language = inviter?.preferredLanguage ?? "en";
      await this.emailService.send(
        InviteGuestMail.create({
          to: email,
          language,
          templateProperties: {
            link: `${this.envService.get("OPEN_DPP_URL")}/accept-guest-access/${guestAccess.id}`,
            organizationName: organization?.name ?? "",
            guestRoleName: GUEST_ROLE_NAME_BY_LANGUAGE[language][guestAccess.guestRole],
          },
        }),
      );
    } catch (error) {
      // The invitation stays pending and visible to the owner; a failed mail must not lose it.
      this.logger.error(`Failed to send guest invitation ${guestAccess.id}`, error);
    }
  }
}
