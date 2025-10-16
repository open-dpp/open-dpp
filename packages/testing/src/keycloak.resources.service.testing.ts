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

  getGroupForOrganization(param: string) {
    const group = this.groups.find(g => g.name === `organization-${param}`)
    return group || null
  }
}
