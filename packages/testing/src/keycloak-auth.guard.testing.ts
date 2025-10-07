import type {
  CanActivate,
  ExecutionContext,
} from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { KeycloakUserInToken } from '@open-dpp/auth'
import { Buffer } from 'node:buffer'
import {
  UnauthorizedException,
} from '@nestjs/common'
import { ALLOW_SERVICE_ACCESS, AuthContext, IS_PUBLIC } from '@open-dpp/auth'

export class KeycloakAuthTestingGuard implements CanActivate {
  public tokenToUserMap: Map<string, KeycloakUserInToken>
  private readonly reflector?: Reflector
  private readonly configService?: Map<string, string>

  constructor(
    tokenToUserMap: Map<string, KeycloakUserInToken>,
    reflector?: Reflector,
    configService?: Map<string, string>,
  ) {
    this.tokenToUserMap = tokenToUserMap
    this.reflector = reflector
    this.configService = configService
  }

  canActivate(context: ExecutionContext) {
    // const [req] = context.getArgs();
    const request: any = context.switchToHttp().getRequest()
    if (this.reflector) {
      const isPublic = this.reflector.get<boolean>(
        IS_PUBLIC,
        context.getHandler(),
      )
      const allowServiceAccess = this.reflector.get<boolean>(
        ALLOW_SERVICE_ACCESS,
        context.getHandler(),
      )
      if (isPublic) {
        return isPublic
      }
      if (allowServiceAccess) {
        if (
          request.headers.service_token
          !== this.configService!.get('SERVICE_TOKEN')
        ) {
          throw new UnauthorizedException('Invalid service token.')
        }
        else {
          return allowServiceAccess
        }
      }
    }

    const header = request.headers.authorization
    if (!header) {
      throw new UnauthorizedException(
        'Authorization: Bearer <token> header missing',
      )
    }

    const parts = header.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Authorization: Bearer <token> header invalid',
      )
    }

    const accessToken = parts[1] // uses [organizationOneId, organizationTwoId, ...] as permissions
    const decoded = Buffer.from(accessToken, 'base64').toString()
    const permissions = decoded.substring(1, decoded.length - 1).split(',')

    if (this.tokenToUserMap.has(accessToken)) {
      const authContext = new AuthContext()
      authContext.token = accessToken
      const user = this.tokenToUserMap.get(accessToken)
      if (!user) {
        throw new UnauthorizedException('Invalid token.')
      }
      authContext.keycloakUser = user
      authContext.permissions = permissions.map((permission) => {
        return {
          type: 'organization',
          resource: permission,
          scopes: ['organization:access'],
        }
      })
      request.authContext = authContext
      return true
    }
    else {
      return false
    }

    // const authContext: AuthContext = await this.keycloakAuthService.getAuthContextFromKeycloakUser(req.user, isPublic);
  }
}
