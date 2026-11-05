import { Injectable } from "@nestjs/common";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { GuestAccessService } from "../../../identity/guest-access/application/services/guest-access.service";
import { MembersRepository } from "../../../identity/organizations/infrastructure/adapters/members.repository";
import { UserRole, UserRoleType } from "../../../identity/users/domain/user-role.enum";
import { Passport } from "../../../passports/domain/passport";

/**
 * Decides what a caller is allowed to see of a passport. The decision depends on the organization
 * that owns the passport, never on an organization the caller names in a request header.
 */
@Injectable()
export class PassportSubjectResolver {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly guestAccessService: GuestAccessService,
  ) {}

  /**
   * An instance admin acts as admin, a member of the passport's organization as that member and
   * an accepted guest as guest. Everybody else, signed in or not, sees what the public sees.
   */
  async resolve(
    passport: Passport,
    caller: { userId?: string; userRole: UserRoleType },
  ): Promise<SubjectAttributes> {
    if (caller.userRole === UserRole.ADMIN) {
      return SubjectAttributes.create({ userRole: UserRole.ADMIN });
    }
    if (caller.userId === undefined) {
      return SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
    }
    const member = await this.membersRepository.findOneByUserIdAndOrganizationId(
      caller.userId,
      passport.organizationId,
    );
    if (member) {
      return SubjectAttributes.create({ userRole: UserRole.USER, memberRole: member.role });
    }
    const guestRole = await this.guestAccessService.findGuestRole(
      caller.userId,
      passport.organizationId,
    );
    if (guestRole) {
      return SubjectAttributes.create({ userRole: UserRole.USER, guestRole });
    }
    return SubjectAttributes.create({ userRole: UserRole.ANONYMOUS });
  }
}
