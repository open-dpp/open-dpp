import type { Request } from "express";
import type { KeycloakUserInToken } from "./keycloak-auth/KeycloakUserInToken";

export class AuthContext {
  keycloakUser!: KeycloakUserInToken;
  token!: string;
  user!: any;
}

export interface AuthRequest extends Request {
  authContext: AuthContext;
}
