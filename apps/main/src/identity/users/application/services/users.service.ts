import type { Auth } from "better-auth";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { UpdateProfileDto } from "@open-dpp/dto";
import { NotFoundError, ValueError } from "@open-dpp/exception";
import { AUTH } from "../../../auth/auth.provider";
import { User } from "../../domain/user";
import { UserRole, UserRoleType } from "../../domain/user-role.enum";
import { UsersRepository } from "../../infrastructure/adapters/users.repository";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(AUTH) private readonly auth: Auth,
    private readonly envService: EnvService,
  ) {}

  async createUser(email: string, firstName?: string, lastName?: string): Promise<User> {
    const fn = firstName?.trim() ?? "";
    const ln = lastName?.trim() ?? "";
    const user = User.create({
      email,
      firstName: fn,
      lastName: ln,
      role: UserRole.USER,
    });
    const saved = await this.usersRepository.save(user);
    if (!saved) {
      throw new Error(`Failed to save user with email ${email}`);
    }
    try {
      await this.auth.api.requestPasswordReset({
        body: { email, redirectTo: "/password-reset" },
      });
    } catch (error) {
      this.logger.error(
        `User ${saved.id} (${saved.email}) was created but the password-reset email failed to send. The user cannot log in until an admin re-triggers the reset email.`,
        error,
      );
    }
    return saved;
  }

  async findOne(id: string) {
    return this.usersRepository.findOneById(id);
  }

  async findOneOrFail(id: string) {
    return await this.usersRepository.findOneOrFail(id);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOneByEmail(email);
  }

  async findAllByIds(ids: Array<string>): Promise<User[]> {
    return this.usersRepository.findAllByIds(ids);
  }

  async setUserEmailVerified(email: string, emailVerified: boolean): Promise<User> {
    const user = await this.usersRepository.findOneByEmail(email);
    if (!user) {
      throw new NotFoundError(User.name, email);
    }
    const updatedUser = user.withEmailVerified(emailVerified);
    const saved = await this.usersRepository.update(updatedUser);
    if (!saved) {
      throw new NotFoundError(User.name, user.id);
    }
    return saved;
  }

  async setUserRole(id: string, role: UserRoleType): Promise<User> {
    const user = await this.findOneOrFail(id);
    const updatedUser = user.withRole(role);
    const saved = await this.usersRepository.update(updatedUser);
    if (!saved) {
      throw new NotFoundError(User.name, id);
    }
    return saved;
  }

  async getMe(userId: string): Promise<User> {
    return this.usersRepository.findOneOrFail(userId);
  }

  async updateProfile(userId: string, patch: UpdateProfileDto): Promise<User> {
    const user = await this.usersRepository.findOneOrFail(userId);
    let next = user;
    if (patch.firstName !== undefined || patch.lastName !== undefined) {
      next = next.withName(patch.firstName ?? user.firstName, patch.lastName ?? user.lastName);
    }
    if (patch.preferredLanguage !== undefined) {
      next = next.withPreferredLanguage(patch.preferredLanguage);
    }
    if (next === user) {
      return user;
    }
    const saved = await this.usersRepository.update(next);
    if (!saved) {
      throw new NotFoundError(User.name, userId);
    }
    return saved;
  }

  async requestEmailChange(
    userId: string,
    newEmail: string,
    headers: BetterAuthHeaders,
  ): Promise<User> {
    const user = await this.usersRepository.findOneOrFail(userId);
    if (user.email === newEmail) {
      throw new ValueError("New email must differ from the current email");
    }
    if (user.pendingEmail !== null) {
      throw new ValueError("An email change is already pending. Cancel it first.");
    }
    const existing = await this.usersRepository.findOneByEmail(newEmail);
    if (existing) {
      throw new ValueError("Email is already in use");
    }
    await this.auth.api.changeEmail({
      body: {
        newEmail,
        callbackURL: `${this.envService.get("OPEN_DPP_URL")}/profile`,
      },
      headers,
    });
    const next = user.withPendingEmail(newEmail, new Date());
    const saved = await this.usersRepository.update(next);
    if (!saved) {
      throw new NotFoundError(User.name, userId);
    }
    return saved;
  }

  async cancelEmailChange(userId: string): Promise<User> {
    const user = await this.usersRepository.findOneOrFail(userId);
    if (user.pendingEmail === null) {
      throw new ValueError("No pending email change to cancel");
    }
    const next = user.withoutPendingEmail();
    const saved = await this.usersRepository.update(next);
    if (!saved) {
      throw new NotFoundError(User.name, userId);
    }
    return saved;
  }

  async clearPendingEmailFor(userId: string): Promise<void> {
    const user = await this.usersRepository.findOneById(userId);
    if (!user || user.pendingEmail === null) {
      return;
    }
    const next = user.withoutPendingEmail();
    await this.usersRepository.update(next);
  }
}
