import type { KeycloakResourceType_TYPE } from './KeycloakResourceType'
import { KeycloakResourceType } from './KeycloakResourceType'

export const KEYCLOAK_RESOURCE_NAME_PREFIX = 'urn:backend'

export class KeycloakResource {
  public readonly name: string = ''
  public readonly type: KeycloakResourceType_TYPE = KeycloakResourceType.ORGANIZATION

  constructor(
    name: string = '',
    type: KeycloakResourceType_TYPE = KeycloakResourceType.ORGANIZATION,
  ) {
    this.name = name
    this.type = type
  }
}
