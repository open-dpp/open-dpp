import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindManyOptions, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { User } from '../domain/user';
import { NotFoundInDatabaseException } from '@app/exception/service.exceptions';
import { KeycloakUserInToken } from '@app/auth/keycloak-auth/KeycloakUserInToken';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  convertToDomain(userEntity: UserEntity) {
    return new User(userEntity.id, userEntity.email);
  }

  async findOne(id: string) {
    const userFound = await this.userRepository.findOne({
      where: { id: Equal(id) },
    });
    return userFound ? this.convertToDomain(userFound) : undefined;
  }

  async findOneAndFail(id: string) {
    const userEntity = await this.userRepository.findOne({
      where: { id: Equal(id) },
    });
    if (!userEntity) {
      throw new NotFoundInDatabaseException(User.name);
    }
    return this.convertToDomain(userEntity);
  }

  async find(options?: FindManyOptions<UserEntity>) {
    const entities = await this.userRepository.find(options);
    return entities.map((entity) => this.convertToDomain(entity));
  }

  async save(user: User) {
    const userEntity = new UserEntity();
    userEntity.id = user.id;
    userEntity.email = user.email;
    return this.convertToDomain(await this.userRepository.save(user));
  }

  async create(keycloakUser: KeycloakUserInToken, ignoreIfExists?: boolean) {
    const find = await this.findOne(keycloakUser.sub);
    if (find && !ignoreIfExists) {
      throw new BadRequestException();
    }
    const user = new UserEntity();
    user.id = keycloakUser.sub;
    user.email = keycloakUser.email;
    return this.userRepository.save(user);
  }
}
