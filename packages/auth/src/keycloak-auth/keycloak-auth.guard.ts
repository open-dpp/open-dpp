import type {
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import type { AxiosResponse } from "axios";
import type { KeycloakUserInToken } from "./KeycloakUserInToken";
import { HttpService } from "@nestjs/axios";
import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import * as jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { firstValueFrom } from "rxjs";
import { ALLOW_SERVICE_ACCESS } from "../allow-service-access.decorator";
import { AuthContext } from "../auth-request";
import { IS_PUBLIC } from "../public/public.decorator";

@Injectable()
export class KeycloakAuthGuard implements CanActivate {
  private jwksClient: jwksRsa.JwksClient;
  private readonly reflector: Reflector;
  private readonly configService: ConfigService;
  private readonly httpService: HttpService;

  constructor(
    reflector: Reflector,
    configService: ConfigService,
    httpService: HttpService,
  ) {
    this.reflector = reflector;
    this.configService = configService;
    this.httpService = httpService;
    this.jwksClient = jwksRsa({
      jwksUri: `${this.configService.get('OPEN_DPP_KEYCLOAK_URL')}/realms/${this.configService.get('OPEN_DPP_KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
      cache: true,
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC,
      context.getHandler(),
    );
    const allowServiceAccess = this.reflector.get<boolean>(
      ALLOW_SERVICE_ACCESS,
      context.getHandler(),
    );
    if (isPublic) {
      return isPublic;
    }
    if (allowServiceAccess) {
      if (
        request.headers.service_token !==
        this.configService.get('OPEN_DPP_SERVICE_TOKEN')
      ) {
        throw new UnauthorizedException("Invalid service token.");
      }
      else {
        return allowServiceAccess;
      }
    }

    const headerAuthorization = request.headers.authorization;
    const headerApiKey = request.headers.api_token;
    let accessToken: string;

    if (headerAuthorization) {
      accessToken = this.readTokenFromJwt(headerAuthorization);
    }
    else if (headerApiKey) {
      accessToken = await this.readTokenFromApiKeyOrFail(headerApiKey);
    }
    else {
      throw new UnauthorizedException("Authorization missing");
    }

    const authContext = new AuthContext();
    authContext.token = accessToken;
    authContext.permissions = [];

    let payload: KeycloakUserInToken & { memberships: string[] | undefined };

    try {
      payload = await this.validateToken(accessToken);
    }
    catch {
      throw new UnauthorizedException(
        "Invalid token. Check if it is maybe expired.",
      );
    }
    authContext.keycloakUser = payload;
    // await this.usersService.create(user, true);
    const memberships = payload.memberships || ([] as string[]);
    memberships.forEach((membership: string) => {
      authContext.permissions.push({
        type: "organization",
        resource: membership.substring(
          membership.lastIndexOf("organization-") + 13,
        ),
        scopes: ["organization:access"],
      });
    });
    request.authContext = authContext;
    return true;
  }

  async validateToken(
    token: string,
  ): Promise<jwt.JwtPayload & KeycloakUserInToken> {
    const validationOptions: jwt.VerifyOptions = {
      audience: this.configService.get('OPEN_DPP_KEYCLOAK_JWT_AUDIENCE'),
      issuer: `${this.configService.get('OPEN_DPP_KEYCLOAK_URL')}/realms/${this.configService.get('OPEN_DPP_KEYCLOAK_REALM')}`,
      algorithms: ['RS256'],
    };
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === "string") {
      throw new UnauthorizedException("Invalid token");
    }
    try {
      const key = await this.getKey(decoded.header);
      const verified = jwt.verify(
        token,
        key.getPublicKey(),
        validationOptions,
      ) as jwt.JwtPayload & KeycloakUserInToken;
      return { ...verified, memberships: (verified as any).memberships ?? [] };
    }
    catch {
      throw new UnauthorizedException("Invalid token");
    }
  }

  private getAuthUrl() {
    const baseUrl = this.configService.get('OPEN_DPP_KEYCLOAK_URL');
    if (!baseUrl) {
      throw new Error("KEYCLOAK_NETWORK_URL configuration is missing");
    }

    try {
      const url = new URL(
        `/realms/${this.configService.get('OPEN_DPP_KEYCLOAK_REALM')}/api-key/auth`,
        baseUrl,
      );
      return url.toString();
    }
    catch {
      throw new Error("Invalid KEYCLOAK_NETWORK_URL configuration");
    }
  }

  private async readTokenFromApiKeyOrFail(
    headerApiKey: string,
  ): Promise<string> {
    const authUrl = this.getAuthUrl();
    try {
      const response = await firstValueFrom<AxiosResponse<{ jwt: string }>>(
        this.httpService.get(authUrl, { params: { apiKey: headerApiKey } }),
      );
      if (response.status === 200) {
        return response.data.jwt;
      }
    }
    catch {
      throw new UnauthorizedException("API Key invalid");
    }
    throw new UnauthorizedException("API Key invalid");
  }

  private readTokenFromJwt(authorization: string): string {
    const parts = authorization.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      throw new UnauthorizedException(
        "Authorization: Bearer <token> header invalid",
      );
    }
    return parts[1];
  }

  private async getKey(header: jwt.JwtHeader): Promise<jwksRsa.SigningKey> {
    if (!header.kid) {
      throw new UnauthorizedException(
        "Token is missing the \"kid\" (Key ID) header.",
      );
    }
    return this.jwksClient.getSigningKey(header.kid);
  }
}
