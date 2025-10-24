import { Injectable } from "@nestjs/common";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { User } from "../src/users/domain/user";

export interface BetterAuthTestUser {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

@Injectable()
export class UsersTestingService {
  private readonly userMap: Map<string, BetterAuthTestUser> = new Map();
  private readonly serviceTokenMap: Map<string, BetterAuthTestUser> = new Map();
  private readonly apiTokenMap: Map<string, BetterAuthTestUser> = new Map();

  convertToDomain(
    userDoc: BetterAuthTestUser,
  ) {
    return User.loadFromDb({
      id: userDoc.id,
      email: userDoc.email,
    });
  }

  async findOne(id: string) {
    const userFound = this.userMap.get(id);
    return userFound ? this.convertToDomain(userFound) : undefined;
  }

  async findOneAndFail(id: string) {
    const userEntity = this.userMap.get(id);
    if (!userEntity) {
      throw new NotFoundInDatabaseException(User.name);
    }
    return this.convertToDomain(userEntity);
  }

  async findByEmail(email: string) {
    const users = Array.from(this.userMap.values()).filter(user => user.email === email);
    if (!users || users.length === 0) {
      return null;
    }
    return this.convertToDomain(users[0]);
  }

  async findAllByIds(ids: Array<string>) {
    const users: User[] = [];
    for (const id of ids) {
      const user = this.userMap.get(id);
      if (user) {
        const domainUser = this.convertToDomain(user);
        users.push(domainUser);
      }
    }
    return users;
  }

  createBetterAuthTestUser(overrides?: Partial<BetterAuthTestUser>): BetterAuthTestUser {
    const user = {
      id: crypto.randomUUID(),
      email: `test-${crypto.randomUUID()}@example.com`,
      ...overrides,
    };
    this.userMap.set(user.id, user);
    return user;
  }

  addUser(user: User) {
    this.userMap.set(user.id, user);
  }

  loadUsers(users: User[]) {
    users.forEach(user => this.userMap.set(user.id, user));
  }

  addServiceToken(serviceToken: string, user: User) {
    this.serviceTokenMap.set(serviceToken, user);
  }

  addApiToken(apiToken: string, user: User) {
    this.apiTokenMap.set(apiToken, user);
  }
}
