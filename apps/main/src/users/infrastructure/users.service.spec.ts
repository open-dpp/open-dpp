import type { TestingModule } from '@nestjs/testing'
import type { KeycloakUserInToken } from '@open-dpp/auth'
import type { Repository } from 'typeorm'
import { expect } from '@jest/globals'
import { BadRequestException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundInDatabaseException } from '@open-dpp/exception'
import { User } from '../domain/user'
import { UserEntity } from './user.entity'
import { UsersService } from './users.service'

describe('usersService', () => {
  let service: UsersService
  let userRepository: Repository<UserEntity>

  // Sample test data
  const userId = '123e4567-e89b-12d3-a456-426614174000'
  const userEmail = 'test@example.com'

  const mockUserEntity: UserEntity = {
    id: userId,
    email: userEmail,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    organizations: [],
    creatorOfOrganizations: [],
    ownerOfOrganizations: [],
  }

  const mockKeycloakUser: KeycloakUserInToken = {
    sub: userId,
    email: userEmail,
    name: 'Test User',
    preferred_username: 'testuser',
    email_verified: true,
    memberships: [],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('convertToDomain', () => {
    it('should convert a UserEntity to a User domain object', () => {
      const result = service.convertToDomain(mockUserEntity)
      expect(result).toBeInstanceOf(User)
      expect(result.id).toBe(userId)
      expect(result.email).toBe(userEmail)
    })
  })

  describe('findOne', () => {
    it('should return a user if found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUserEntity)

      const result = await service.findOne(userId)

      expect(result).toBeDefined()
      if (result) {
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { id: expect.anything() },
        })
        expect(result).toBeInstanceOf(User)
        expect(result.id).toBe(userId)
        expect(result.email).toBe(userEmail)
      }
    })

    it('should return undefined if no user is found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null)

      const result = await service.findOne('nonexistent-id')

      expect(userRepository.findOne).toHaveBeenCalled()
      expect(result).toBeUndefined()
    })
  })

  describe('findOneAndFail', () => {
    it('should return a user if found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUserEntity)

      const result = await service.findOneAndFail(userId)

      expect(userRepository.findOne).toHaveBeenCalled()
      expect(result).toBeInstanceOf(User)
      expect(result.id).toBe(userId)
    })

    it('should throw NotFoundInDatabaseException if no user is found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null)

      await expect(service.findOneAndFail('nonexistent-id')).rejects.toThrow(
        NotFoundInDatabaseException,
      )
      expect(userRepository.findOne).toHaveBeenCalled()
    })
  })

  describe('find', () => {
    it('should return an array of User domain objects', async () => {
      const mockEntities = [
        mockUserEntity,
        { ...mockUserEntity, id: 'user2', email: 'user2@example.com' },
      ]
      jest.spyOn(userRepository, 'find').mockResolvedValue(mockEntities)

      const result = await service.find()

      expect(userRepository.find).toHaveBeenCalled()
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(User)
      expect(result[1]).toBeInstanceOf(User)
    })
  })

  describe('save', () => {
    it('should save a user and return the domain object', async () => {
      const user = new User(userId, userEmail)
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUserEntity)

      const result = await service.save(user)

      expect(userRepository.save).toHaveBeenCalled()
      expect(result).toBeInstanceOf(User)
      expect(result.id).toBe(userId)
    })
  })

  describe('create', () => {
    it('should create a new user from keycloak data if user does not exist', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(undefined)
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUserEntity)

      const result = await service.create(mockKeycloakUser)

      expect(service.findOne).toHaveBeenCalledWith(userId)
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: userId,
          email: userEmail,
        }),
      )
      expect(result).toEqual(mockUserEntity)
    })

    it('should throw BadRequestException if user already exists and ignoreIfExists is false', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(new User(userId, userEmail))

      await expect(service.create(mockKeycloakUser)).rejects.toThrow(
        BadRequestException,
      )
      expect(service.findOne).toHaveBeenCalledWith(userId)
      expect(userRepository.save).not.toHaveBeenCalled()
    })

    it('should not throw if user exists but ignoreIfExists is true', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(new User(userId, userEmail))
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUserEntity)

      await service.create(mockKeycloakUser, true)

      expect(service.findOne).toHaveBeenCalledWith(userId)
      expect(userRepository.save).toHaveBeenCalled()
    })
  })
})
