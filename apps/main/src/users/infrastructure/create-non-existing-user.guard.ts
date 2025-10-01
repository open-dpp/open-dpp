import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthContext } from '@open-dpp/auth';

@Injectable()
export class CreateNonExistingUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.authContext) {
      await this.usersService.create(
        (request.authContext as AuthContext).keycloakUser,
        true,
      );
    }
    return true;
  }
}
