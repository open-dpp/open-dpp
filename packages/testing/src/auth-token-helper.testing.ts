import type { KeycloakAuthTestingGuard } from './keycloak-auth.guard.testing'
import { Buffer } from 'node:buffer'
import { createKeycloakUserInToken } from './users-and-orgs'

function getKeycloakAuthToken(userId: string, keycloakAuthTestingGuard: KeycloakAuthTestingGuard) {
  const token = Buffer.from(userId).toString('base64')
  const user = createKeycloakUserInToken(userId)
  keycloakAuthTestingGuard.tokenToUserMap.set(token, user)
  return `Bearer ${token}`
}

export default getKeycloakAuthToken
