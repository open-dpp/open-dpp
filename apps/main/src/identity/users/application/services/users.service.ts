import { Injectable } from "@nestjs/common";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { User } from "../../domain/user";
import { UserRole } from "../../domain/user-role.enum";
import { UsersRepository } from "../../infrastructure/adapters/users.repository";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) { }

  async createUser(email: string, firstName: string, lastName: string): Promise<void> {
    const user = User.create({
      email,
      firstName,
      lastName,
      role: UserRole.USER,
    });
    await this.usersRepository.save(user);
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
