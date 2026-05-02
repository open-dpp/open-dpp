import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { UpdateProfileDto } from "@open-dpp/dto";
import { NotFoundError } from "@open-dpp/exception";
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
  ) {}

  async createUser(email: string, firstName?: string, lastName?: string): Promise<User> {
    const user = User.create({
      email,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
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
}
