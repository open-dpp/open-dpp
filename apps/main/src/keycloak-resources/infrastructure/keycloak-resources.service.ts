import type { ConfigService } from '@nestjs/config'
import type { AuthContext } from '@open-dpp/auth'
import type { Organization } from '../../organizations/domain/organization'
import type { User } from '../../users/domain/user'
import KcAdminClient from '@keycloak/keycloak-admin-client'
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

@Injectable()
export class KeycloakResourcesService {
  private readonly logger = new Logger(KeycloakResourcesService.name)
  private readonly kcAdminClient
  private readonly realm: string

  constructor(private configService: ConfigService) {
    this.kcAdminClient = new KcAdminClient({
      baseUrl: this.configService.get<string>('KEYCLOAK_NETWORK_URL', ''),
    })
    this.realm = this.configService.get<string>('KEYCLOAK_REALM', '')
  }

  async reloadToken() {
    await this.kcAdminClient.auth({
      grantType: 'password',
      clientId: 'admin-cli',
      username: this.configService.get('KEYCLOAK_ADMIN_USERNAME'),
      password: this.configService.get('KEYCLOAK_ADMIN_PASSWORD'),
    })
  }

  async createResource(
    authContext: AuthContext,
    resourceName: string,
    uris: string[],
  ) {
    await this.reloadToken()
    await this.kcAdminClient.clients.createResource(
      {
        id: 'backend',
        realm: this.realm,
      },
      {
        name: resourceName,
        type: `urn:backend:${resourceName}`,
        uris,
        ownerManagedAccess: true,
        attributes: {
          owner: [authContext.keycloakUser.sub],
        },
        scopes: [
          {
            name: 'read',
          },
        ],
      },
    )
  }

  async createUser(user: User) {
    await this.reloadToken()
    const findUser = await this.findKeycloakUserByEmail(user.email)
    if (findUser) {
      return
    }
    await this.kcAdminClient.users.create({
      realm: this.realm,
      username: user.email,
      email: user.email,
      emailVerified: true,
      enabled: true,
      attributes: {
        preferred_username: user.email,
      },
    })
  }

  async createGroup(organization: Organization) {
    await this.reloadToken()
    const name = `organization-${organization.id}`
    /* const clients = await this.kcAdminClient.clients.find({
      realm: this.realm,
      clientId: 'backend',
    });
    if (clients.length === 0) {
      throw new Error('Backend client not found');
    }
    if (clients.length > 1) {
      throw new Error('Backend client not found');
    }
    const client = clients[0]; */
    const createdGroup = await this.kcAdminClient.groups.create({
      name,
      realm: this.realm,
    })
    if (
      !organization.members.some(
        member => member.id === organization.createdByUserId,
      )
    ) {
      await this.kcAdminClient.users.addToGroup({
        id: organization.createdByUserId,
        groupId: createdGroup.id,
        realm: this.realm,
      })
    }
    if (
      !organization.members.some(
        member => member.id === organization.ownedByUserId,
      )
    ) {
      await this.kcAdminClient.users.addToGroup({
        id: organization.ownedByUserId,
        groupId: createdGroup.id,
        realm: this.realm,
      })
    }
    for (const member of organization.members) {
      await this.kcAdminClient.users.addToGroup({
        id: member.id,
        groupId: createdGroup.id,
        realm: this.realm,
      })
    }
  }

  async removeGroup(groupId: string) {
    await this.reloadToken()
    await this.kcAdminClient.groups.del({
      id: groupId,
      realm: this.realm,
    })
  }

  async inviteUserToGroup(
    authContext: AuthContext,
    groupId: string,
    userId: string,
  ) {
    await this.reloadToken()
    const keycloakUser = await this.kcAdminClient.users.findOne({
      id: authContext.keycloakUser.sub,
      realm: this.realm,
    })
    if (!keycloakUser) {
      throw new UnauthorizedException()
    }
    const groups = await this.kcAdminClient.users.listGroups({
      id: authContext.keycloakUser.sub,
      realm: this.realm,
    })
    if (!groups.some(g => g.name === `organization-${groupId}`)) {
      throw new ForbiddenException()
    }
    const keycloakUserRequester = await this.kcAdminClient.users.findOne({
      id: userId,
      realm: this.realm,
    })
    if (!keycloakUserRequester) {
      throw new UnauthorizedException()
    }
    const groupsRequester = await this.kcAdminClient.users.listGroups({
      id: userId,
      realm: this.realm,
    })
    if (
      !keycloakUserRequester
      || groupsRequester.some(g => g.name === `organization-${groupId}`)
    ) {
      throw new BadRequestException()
    }
    const keycloakGroups = await this.kcAdminClient.groups.find({
      search: `organization-${groupId}`,
      realm: this.realm,
    })
    if (
      !keycloakGroups
      || !keycloakGroups.length
      || keycloakGroups.length === 0
    ) {
      throw new NotFoundException()
    }
    if (keycloakGroups.length > 1) {
      throw new BadRequestException()
    }
    const keycloakGroup = keycloakGroups[0]
    await this.kcAdminClient.users.addToGroup({
      id: userId,
      groupId: keycloakGroup.id,
      realm: this.realm,
    })
  }

  async getUsers() {
    await this.reloadToken()
    return this.kcAdminClient.users.find({ realm: this.realm })
  }

  async findKeycloakUserByEmail(email: string) {
    await this.reloadToken()
    const users = await this.kcAdminClient.users.find({
      realm: this.realm,
      email,
    })
    if (users.length === 0) {
      return null
    }
    else if (users.length > 1) {
      this.logger.warn('More than one user found for email')
    }
    return users[0]
  }

  async getGroupForOrganization(organizationId: string) {
    await this.reloadToken()
    const groups = await this.kcAdminClient.groups.find({
      search: `organization-${organizationId}`,
      realm: this.realm,
    })
    if (groups.length > 1) {
      throw new Error('More than one group found for organization')
    }
    else if (groups.length === 0) {
      return null
    }
    return groups[0]
  }
}
