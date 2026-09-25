import type { AxiosInstance } from "axios";
import type { ContinueAuthorizationDto, ContinueAuthorizationResponseDto } from "@open-dpp/dto";

/** The OAuth Provider steps open-dpp's own pages take (see CONTEXT.md: OAuth Provider). */
export class OAuthProviderNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  /** Finishes a `prompt=create` authorization for the signed-in User; answers the Trusted Client redirect. */
  public async continueAuthorization(data: ContinueAuthorizationDto) {
    return this.axiosInstance.post<ContinueAuthorizationResponseDto>(
      "/oauth-provider/continue",
      data,
    );
  }
}
