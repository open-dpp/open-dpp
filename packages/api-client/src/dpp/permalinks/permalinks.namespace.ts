import type {
  BrandingDto,
  PassportDto,
  PermalinkDto,
  PresentationConfigurationDto,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";
import { AasNamespace } from "../aas/aasNamespace";

export class PermalinksNamespace {
  public aas!: AasNamespace;

  constructor(private readonly axiosInstance: AxiosInstance) {
    this.aas = new AasNamespace(this.axiosInstance, "p");
  }

  public async getByPassport(passportId: string) {
    return this.axiosInstance.get<PermalinkDto[]>(
      `/p?passportId=${encodeURIComponent(passportId)}`,
    );
  }

  public async getPassport(idOrSlug: string) {
    return this.axiosInstance.get<PassportDto>(
      `/p/${encodeURIComponent(idOrSlug)}/passport`,
    );
  }

  public async getBranding(idOrSlug: string) {
    return this.axiosInstance.get<BrandingDto>(
      `/p/${encodeURIComponent(idOrSlug)}/branding`,
    );
  }

  public async getPresentationConfiguration(idOrSlug: string) {
    return this.axiosInstance.get<PresentationConfigurationDto>(
      `/p/${encodeURIComponent(idOrSlug)}/presentation-configuration`,
    );
  }
}
