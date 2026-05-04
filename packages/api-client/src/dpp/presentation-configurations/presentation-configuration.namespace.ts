import type {
  PresentationConfigurationCreateRequestDto,
  PresentationConfigurationDto,
  PresentationConfigurationListResponseDto,
  PresentationConfigurationPatchDto,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";

export type PresentationConfigurationScope = "templates" | "passports";

export class PresentationConfigurationNamespace {
  private readonly basePath: string;

  constructor(
    private readonly axiosInstance: AxiosInstance,
    scope: PresentationConfigurationScope,
  ) {
    this.basePath = `/${scope}`;
  }

  // Singular — kept for the public viewer.
  public async get(id: string) {
    return await this.axiosInstance.get<PresentationConfigurationDto>(
      `${this.basePath}/${id}/presentation-configuration`,
    );
  }

  // Plural — editor surface.
  public async list(id: string) {
    return await this.axiosInstance.get<PresentationConfigurationListResponseDto>(
      `${this.basePath}/${id}/presentation-configurations`,
    );
  }

  public async create(id: string, body: PresentationConfigurationCreateRequestDto) {
    return await this.axiosInstance.post<PresentationConfigurationDto>(
      `${this.basePath}/${id}/presentation-configurations`,
      body,
    );
  }

  public async getById(id: string, configId: string) {
    return await this.axiosInstance.get<PresentationConfigurationDto>(
      `${this.basePath}/${id}/presentation-configurations/${configId}`,
    );
  }

  public async patchById(
    id: string,
    configId: string,
    body: PresentationConfigurationPatchDto,
  ) {
    return await this.axiosInstance.patch<PresentationConfigurationDto>(
      `${this.basePath}/${id}/presentation-configurations/${configId}`,
      body,
    );
  }

  public async deleteById(id: string, configId: string) {
    return await this.axiosInstance.delete<void>(
      `${this.basePath}/${id}/presentation-configurations/${configId}`,
    );
  }
}
