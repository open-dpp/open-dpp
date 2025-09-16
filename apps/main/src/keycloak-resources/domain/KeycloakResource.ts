import { KeycloakResourceType } from './KeycloakResourceType';

export const KEYCLOAK_RESOURCE_NAME_PREFIX = 'urn:backend';

export class KeycloakResource {
  constructor(
    public readonly name: string = '',
    public readonly type: KeycloakResourceType = KeycloakResourceType.ORGANIZATION,
  ) {}
}
