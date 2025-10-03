export const KeycloakResourceType = {
  ORGANIZATION: 'organization',
} as const

export type KeycloakResourceType_TYPE = (typeof KeycloakResourceType)[keyof typeof KeycloakResourceType]
