import type { Auth } from "better-auth";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { AUTH } from "../../../auth/auth.provider";
import { User } from "../../domain/user";
import { UserRole } from "../../domain/user-role.enum";
import { UsersRepository } from "../../infrastructure/adapters/users.repository";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(AUTH) private readonly auth: Auth,
  ) { }

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
      await (this.auth.api as any).forgetPassword({
        body: { email, redirectTo: "/password-reset" },
      });
    }
    catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
    }
    return saved;
  }

  async findOne(id: string) {
    return this.usersRepository.findOneById(id);
  }

  async findOneAndFail(id: string) {
    const userEntity = await this.usersRepository.findOneById(id);
    if (!userEntity) {
      throw new NotFoundInDatabaseException(User.name);
    }
    return userEntity;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOneByEmail(email);
  }

  async findAllByIds(ids: Array<string>): Promise<User[]> {
    return this.usersRepository.findAllByIds(ids);
  }

  async setUserEmailVerified(email: string, emailVerified: boolean): Promise<void> {
    await this.usersRepository.setUserEmailVerified(email, emailVerified);
  }
}
