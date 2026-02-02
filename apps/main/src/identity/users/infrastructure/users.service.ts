import type { User as BetterAuthUser } from "better-auth";
import { Injectable } from "@nestjs/common";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { AuthService } from "../../auth/application/services/auth.service";
import { User } from "../domain/user";
import { UsersRepository } from "./adapters/users.repository";

@Injectable()
export class UsersService {
  constructor(
    private readonly authService: AuthService,
    private readonly usersRepository: UsersRepository,
  ) { }

  async createUser(email: string, firstName: string, lastName: string): Promise<void> {
    const user = User.create({
      email,
      firstName,
      lastName,
    });
    await this.usersRepository.save(user);
  }

  async getUser(userId: string): Promise<User | null> {
    return this.usersRepository.findOneById(userId);
  }

  convertToDomain(
    userDoc: BetterAuthUser,
  ) {
    return User.loadFromDb({
      id: userDoc.id,
      email: userDoc.email,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
      name: userDoc.name || undefined,
      image: userDoc.image || undefined,
      emailVerified: userDoc.emailVerified || false,
    });
  }

  async findOne(id: string) {
    const userFound = await this.authService.getUserById(id);
    return userFound ? this.convertToDomain(userFound) : undefined;
  }

  async findOneAndFail(id: string) {
    const userEntity = await this.authService.getUserById(id);
    if (!userEntity) {
      throw new NotFoundInDatabaseException(User.name);
    }
    return this.convertToDomain(userEntity);
  }

  async findByEmail(email: string) {
    const user = await this.authService.getUserByEmail(email);
    if (!user) {
      return null;
    }
    return this.convertToDomain(user);
  }

  async findAllByIds(ids: Array<string>) {
    const users: User[] = [];
    for (const id of ids) {
      const user = await this.authService.getUserById(id);
      if (user) {
        const domainUser = this.convertToDomain(user);
        users.push(domainUser);
      }
    }
    return users;
  }
}
