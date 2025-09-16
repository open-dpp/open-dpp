export interface KeycloakUserInToken {
  sub: string;
  email: string;
  name: string;
  preferred_username: string;
  email_verified: boolean;
  memberships: string[];
}
