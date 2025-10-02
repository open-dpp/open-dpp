import { expect } from '@jest/globals'
import {
  KEYCLOAK_RESOURCE_NAME_PREFIX,
  KeycloakResource,
} from './KeycloakResource'
import { KeycloakResourceType } from './KeycloakResourceType'

describe('keycloakResource', () => {
  it('should create a keycloak resource with default values', () => {
    const resource = new KeycloakResource()
    expect(resource.name).toEqual('')
    expect(resource.type).toEqual(KeycloakResourceType.ORGANIZATION)
  })

  it('should create a keycloak resource with specified values', () => {
    const name = 'test-resource'
    const type = KeycloakResourceType.ORGANIZATION
    const resource = new KeycloakResource(name, type)
    expect(resource.name).toEqual(name)
    expect(resource.type).toEqual(type)
  })

  it('should have the correct resource name prefix constant', () => {
    expect(KEYCLOAK_RESOURCE_NAME_PREFIX).toEqual('urn:backend')
  })
})
