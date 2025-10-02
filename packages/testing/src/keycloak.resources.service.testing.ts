import { Expose, plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AuthContext } from '@open-dpp/auth';
import { Organization } from '../../../apps/main/src/organizations/domain/organization';

type KeycloakUser = {
  id: string;
  email: string;
  name?: string;
};

type KeycloakGroup = {
  id: string;
  name: string;
  members: KeycloakUser[];
};

@Injectable()
export class KeycloakResourcesServiceTesting {
  @Expose()
  readonly users: KeycloakUser[] = [];

  readonly groups: KeycloakGroup[] = [];

  static fromPlain(plain: Partial<KeycloakResourcesServiceTesting>) {
    return plainToInstance(KeycloakResourcesServiceTesting, plain, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
    });
  }

  getUsers() {
    return this.users;
  }

  createGroup(organization: Organization) {
    const group = {
      id: randomUUID(),
      name: organization.name,
      members: organization.members.map((m) => ({ id: m.id, email: m.email })),
    };
    this.groups.push(group);
  }

  inviteUserToGroup(authContext: AuthContext, groupId: string, userId: string) {
    const realGroupId = groupId.startsWith('organization-')
      ? groupId.substring('organization-'.length)
      : groupId;
    const group = this.groups.find((g) => g.id === realGroupId);
    const user = this.users.find((u) => u.id === userId);
    if (!group || !user) {
      console.log(group, groupId, realGroupId, this.groups);
      throw new Error('User or group not found');
    }
    group.members.push({ id: userId, email: user.email });
  }

  findKeycloakUserByEmail(email: string) {
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      throw new Error('User not found with email: ' + email);
    }
    return user;
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

  getGroupForOrganization(param: Organization | string) {
    if (typeof param === 'string') {
      // Handle string parameter (organizationId)
      const group = this.groups.find((g) => g.name === `organization-${param}`);
      return group || null;
    } else {
      // Handle Organization parameter
      return {
        id: randomUUID(),
        name: param.name,
        members: param.members
          ? param.members.map((m) => ({ id: m.id, email: m.email }))
          : [],
      };
    }
  }
}
