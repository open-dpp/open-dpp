import type { BrandingDto } from "@open-dpp/dto";
import type { AxiosInstance } from "axios";

export class BrandingNamespace {
  private readonly brandingEndpoint = "/branding";

  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async get() {
    return await this.axiosInstance.get<BrandingDto>(this.brandingEndpoint);
  }

  public async set(branding: BrandingDto) {
    return await this.axiosInstance.put<BrandingDto>(this.brandingEndpoint, branding);
  }

  /**
   * Public, ownership-gated organization logo download. The bare `/media/:id` route is
   * authenticated, so anonymous logo rendering goes through this branding-scoped route.
   */
  public async downloadLogo(mediaId: string) {
    return await this.axiosInstance.get<Blob>(
      `${this.brandingEndpoint}/logo/${encodeURIComponent(mediaId)}`,
      { responseType: "blob" },
    );
  }
}
