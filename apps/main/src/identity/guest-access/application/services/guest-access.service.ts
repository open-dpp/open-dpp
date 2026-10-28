import { ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { DisplayLanguageType } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException, ValueError } from "@open-dpp/exception";
import { BaseEmail } from "../../../../email/domain/base-email";
import { GuestAccessRevokedMail } from "../../../../email/domain/guest-access-revoked-mail";
import { GuestRoleChangedMail } from "../../../../email/domain/guest-role-changed-mail";
import { InviteGuestMail } from "../../../../email/domain/invite-guest-mail";
import { EmailService } from "../../../../email/email.service";
import { MembersService } from "../../../organizations/application/services/members.service";
import { OrganizationsRepository } from "../../../organizations/infrastructure/adapters/organizations.repository";
import { User } from "../../../users/domain/user";
import { UsersRepository } from "../../../users/infrastructure/adapters/users.repository";
import { DirectGuestAccess } from "../../domain/direct-guest-access";
import { GuestAccess } from "../../domain/guest-access";
import { GuestAccessStatus } from "../../domain/guest-access-kind.enum";
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
    await this.notifyGuest(guestAccess, data.actingUserId, "invitation", (context) =>
      InviteGuestMail.create({
        to: guestAccess.email,
        language: context.language,
        templateProperties: {
          link: this.acceptLink(guestAccess),
          organizationName: context.organizationName,
          guestRoleName: GUEST_ROLE_NAME_BY_LANGUAGE[context.language][guestAccess.guestRole],
        },
      }),
    );
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
    const previousRole = guestAccess.guestRole;
    guestAccess.changeGuestRole(data.guestRole);
    const saved = await this.guestAccessRepository.save(guestAccess);
    if (previousRole !== guestAccess.guestRole) {
      await this.notifyGuest(guestAccess, data.actingUserId, "role change", (context) =>
        GuestRoleChangedMail.create({
          to: guestAccess.email,
          language: context.language,
          templateProperties: {
            organizationName: context.organizationName,
            guestRoleName: GUEST_ROLE_NAME_BY_LANGUAGE[context.language][guestAccess.guestRole],
            // A guest who has not accepted yet needs the link to do so
            link:
              guestAccess.status === GuestAccessStatus.PENDING
                ? this.acceptLink(guestAccess)
                : undefined,
          },
        }),
      );
    }
    return saved;
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
    const wasRevoked = guestAccess.status === GuestAccessStatus.REVOKED;
    const wasAccepted = guestAccess.status === GuestAccessStatus.ACCEPTED;
    guestAccess.revoke(new Date());
    const saved = await this.guestAccessRepository.save(guestAccess);
    // Revoking again changes nothing, so nobody is notified twice
    if (!wasRevoked && guestAccess instanceof DirectGuestAccess) {
      await this.notifyGuest(guestAccess, data.actingUserId, "revocation", (context) =>
        GuestAccessRevokedMail.create({
          to: guestAccess.email,
          language: context.language,
          templateProperties: { organizationName: context.organizationName, accepted: wasAccepted },
        }),
      );
    }
    return saved;
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

  private acceptLink(guestAccess: GuestAccess): string {
    return `${this.envService.get("OPEN_DPP_URL")}/accept-guest-access/${guestAccess.id}`;
  }

  /**
   * Tells the guest about a change. The mail is in the language of the guest if the guest has an
   * account, otherwise in the language of the owner who acts. A failed mail must not undo the
   * change: the owner sees the new state and the guest simply is not told.
   */
  private async notifyGuest(
    guestAccess: DirectGuestAccess,
    actingUserId: string,
    description: string,
    buildMail: (context: { language: DisplayLanguageType; organizationName: string }) => BaseEmail,
  ): Promise<void> {
    try {
      const organization = await this.organizationsRepository.findOneById(
        guestAccess.organizationId,
      );
      const recipientOrInviter = await this.usersRepository.findOneById(
        guestAccess.acceptedByUserId ?? actingUserId,
      );
      await this.emailService.send(
        buildMail({
          language: recipientOrInviter?.preferredLanguage ?? "en",
          organizationName: organization?.name ?? "",
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to send the mail about the ${description} of ${guestAccess.id}`,
        error,
      );
    }
  }
}
