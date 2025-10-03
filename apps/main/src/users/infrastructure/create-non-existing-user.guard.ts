import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { AuthContext } from '@open-dpp/auth'
import type { UsersService } from './users.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class CreateNonExistingUserGuard implements CanActivate {
  private readonly usersService: UsersService

  constructor(usersService: UsersService) {
    this.usersService = usersService
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    if (request.authContext) {
      await this.usersService.create(
        (request.authContext as AuthContext).keycloakUser,
        true,
      )
    }
    return true
  }
}
