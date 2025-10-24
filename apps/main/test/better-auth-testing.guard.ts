// better-auth-testing.guard.ts
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ALLOW_SERVICE_ACCESS } from "../src/auth/allow-service-access.decorator";
import { User } from "../src/users/domain/user";

export interface BetterAuthTestUser {
  id: string;
  email: string;
  name?: string;
  [key: string]: any;
}

@Injectable()
export class BetterAuthTestingGuard implements CanActivate {
  private readonly userMap: Map<string, BetterAuthTestUser> = new Map();
  private readonly serviceTokenMap: Map<string, BetterAuthTestUser> = new Map();
  private readonly apiTokenMap: Map<string, BetterAuthTestUser> = new Map();
  private readonly reflector: Reflector;

  constructor(reflector: Reflector) {
    this.reflector = reflector;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const serviceToken = request.headers.service_token;
    const apiToken = request.headers.api_token;

    const isPublic = this.reflector.getAllAndOverride<boolean>("PUBLIC", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic)
      return true;

    const isOptional = this.reflector.getAllAndOverride<boolean>("OPTIONAL", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isOptional) {
      return true;
    }

    const isAllowServiceAccess = this.reflector.getAllAndOverride<boolean>(ALLOW_SERVICE_ACCESS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (serviceToken && isAllowServiceAccess) {
      const user = this.serviceTokenMap.get(serviceToken);
      if (user) {
        request.user = user;
        request.session = {
          user,
        };
        return true;
      }
      return false;
    }

    if (apiToken) {
      const user = this.apiTokenMap.get(apiToken);
      if (user) {
        request.user = user;
        request.session = {
          user,
        };
        return true;
      }
      return false;
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.substring(7);
    const user = this.userMap.get(token);

    if (!user) {
      return false;
    }

    request.user = user;
    request.session = {
      user,
    };
    return true;
  }

  createBetterAuthTestUser(overrides?: Partial<BetterAuthTestUser>): BetterAuthTestUser {
    const user = {
      id: crypto.randomUUID(),
      email: `test-${crypto.randomUUID()}@example.com`,
      ...overrides,
    };
    this.userMap.set(user.id, user);
    return user;
  }

  addUser(user: User) {
    this.userMap.set(user.id, user);
  }

  loadUsers(users: User[]) {
    users.forEach(user => this.userMap.set(user.id, user));
  }

  addServiceToken(serviceToken: string, user: User) {
    this.serviceTokenMap.set(serviceToken, user);
  }

  addApiToken(apiToken: string, user: User) {
    this.apiTokenMap.set(apiToken, user);
  }

  getUserById(userId: string): { _id: string; email: string } | null {
    const user = this.userMap.get(userId);
    if (user) {
      return {
        _id: user.id,
        email: user.email,
      };
    }
    return null;
  }
}

export function getBetterAuthToken(userId: string): string {
  return `Bearer ${userId}`;
}
