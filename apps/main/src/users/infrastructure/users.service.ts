import type { KeycloakUserInToken } from '@open-dpp/auth'
import type { FindManyOptions, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { NotFoundInDatabaseException } from '@open-dpp/exception'
import { Equal } from 'typeorm'
import { User } from '../domain/user'
import { UserEntity } from './user.entity'

@Injectable()
export class UsersService {
  private userRepository: Repository<UserEntity>

  constructor(
    @InjectRepository(UserEntity)
    userRepository: Repository<UserEntity>,
  ) {
    this.userRepository = userRepository
  }

  convertToDomain(userEntity: UserEntity) {
    return new User(userEntity.id, userEntity.email)
  }

  async findOne(id: string) {
    const userFound = await this.userRepository.findOne({
      where: { id: Equal(id) },
    })
    return userFound ? this.convertToDomain(userFound) : undefined
  }

  async findOneAndFail(id: string) {
    const userEntity = await this.userRepository.findOne({
      where: { id: Equal(id) },
    })
    if (!userEntity) {
      throw new NotFoundInDatabaseException(User.name)
    }
    return this.convertToDomain(userEntity)
  }

  async find(options?: FindManyOptions<UserEntity>) {
    const entities = await this.userRepository.find(options)
    return entities.map(entity => this.convertToDomain(entity))
  }

  async save(user: User) {
    const userEntity = new UserEntity()
    userEntity.id = user.id
    userEntity.email = user.email
    return this.convertToDomain(await this.userRepository.save(user))
  }

  async create(keycloakUser: KeycloakUserInToken, ignoreIfExists?: boolean) {
    const find = await this.findOne(keycloakUser.sub)
    if (find && !ignoreIfExists) {
      throw new BadRequestException()
    }
    const user = new UserEntity()
    user.id = keycloakUser.sub
    user.email = keycloakUser.email
    return this.userRepository.save(user)
  }
}
