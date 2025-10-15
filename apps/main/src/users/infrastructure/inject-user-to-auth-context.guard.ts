import type { CanActivate, ExecutionContext } from "@nestjs/common";
import type { AuthRequest } from "@open-dpp/auth";
import { Injectable } from "@nestjs/common";
import { UsersService } from "./users.service";

@Injectable()
export class InjectUserToAuthContextGuard implements CanActivate {
  private readonly usersService: UsersService;

  constructor(usersService: UsersService) {
    this.usersService = usersService;
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as AuthRequest;
    if (request.authContext) {
      request.authContext.user = await this.usersService.findByKeycloakUserId(
        request.authContext.keycloakUser.sub,
      );
    }
    return true;
  }
}
