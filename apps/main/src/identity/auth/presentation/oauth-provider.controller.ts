import type { ContinueAuthorizationDto, ContinueAuthorizationResponseDto } from "@open-dpp/dto";
import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ContinueAuthorizationDtoSchema } from "@open-dpp/dto";
import { ZodValidationPipe } from "@open-dpp/exception";
import { OAuthProviderService } from "../application/services/oauth-provider.service";
import { extractBetterAuthHeaders } from "../domain/better-auth-headers";
import { SessionOnly } from "./decorators/session-only.decorator";

/**
 * The OAuth Provider steps open-dpp's own pages take, so the SPA reaches the provider
 * through the API. The Trusted Client itself talks to the provider on the auth mount.
 */
@Controller("oauth-provider")
export class OAuthProviderController {
  constructor(private readonly oauthProviderService: OAuthProviderService) {}

  /** The sign-up page finishes a `prompt=create` authorization for a signed-in User. */
  @Post("continue")
  @HttpCode(HttpStatus.OK)
  @SessionOnly()
  async continueAuthorization(
    @Headers() headers: Record<string, string>,
    @Body(new ZodValidationPipe(ContinueAuthorizationDtoSchema)) body: ContinueAuthorizationDto,
  ): Promise<ContinueAuthorizationResponseDto> {
    const url = await this.oauthProviderService.continueAfterSignup(
      body.oauthQuery,
      extractBetterAuthHeaders(headers),
    );
    return { url };
  }
}
