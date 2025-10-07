import type { Request } from "express";
import type { KeycloakUserInToken } from "./keycloak-auth/KeycloakUserInToken";
import type { ResourcePermission } from "./permissions/resource-permission.interface";

export class AuthContext {
  permissions!: Array<ResourcePermission>;
  keycloakUser!: KeycloakUserInToken;
  token!: string;
}

export interface AuthRequest extends Request {
  authContext: AuthContext;
}
