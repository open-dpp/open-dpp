import type { AuthContext } from '@open-dpp/auth'
import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'

interface KeycloakUser {
  id: string
  email: string
  name?: string
}

interface KeycloakGroup {
  id: string
  name: string
  members: KeycloakUser[]
}

@Injectable()
export class KeycloakResourcesServiceTesting {
  readonly users: KeycloakUser[] = []

  readonly groups: KeycloakGroup[] = []

  static fromPlain(plain: Partial<KeycloakResourcesServiceTesting>) {
    return plainToInstance(KeycloakResourcesServiceTesting, plain, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
    })
  }

  getUsers() {
    return this.users
  }

  createGroup(name: string, members: Array<{ id: string, email: string }> = []) {
    const group = {
      id: randomUUID(),
      name,
      members,
    }
    this.groups.push(group)
  }

  inviteUserToGroup(authContext: AuthContext, groupId: string, userId: string) {
    const realGroupId = groupId.startsWith('organization-')
      ? groupId.substring('organization-'.length)
      : groupId
    const group = this.groups.find(g => g.id === realGroupId)
    const user = this.users.find(u => u.id === userId)
    if (!group || !user) {
      throw new Error('User or group not found')
    }
    group.members.push({ id: userId, email: user.email })
  }

  findKeycloakUserByEmail(email: string) {
    const user = this.users.find(u => u.email === email)
    if (!user) {
      throw new Error(`User not found with email: ${email}`)
    }
    return user
  }

  async reloadToken() {
    // No-op for testing
  }

  async createResource() {
    // No-op for testing
  }

  async createUser() {
    // No-op for testing
  }

  async removeGroup() {
    // No-op for testing
  }

  getGroupForOrganization(param: string) {
    const group = this.groups.find(g => g.name === `organization-${param}`)
    return group || null
  }
}
