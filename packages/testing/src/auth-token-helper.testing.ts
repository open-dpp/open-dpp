import type { KeycloakAuthTestingGuard } from './keycloak-auth.guard.testing'
import { Buffer } from 'node:buffer'
import { createKeycloakUserInToken } from './users-and-orgs'

function getKeycloakAuthToken(userId: string, organizationIds: string[], keycloakAuthTestingGuard: KeycloakAuthTestingGuard) {
  const organizationsString = `[${organizationIds.map(id => id).join(',')}]`
  const token = Buffer.from(organizationsString).toString('base64')
  const user = createKeycloakUserInToken(userId)
  keycloakAuthTestingGuard.tokenToUserMap.set(token, user)
  return `Bearer ${token}`
}

export default getKeycloakAuthToken
