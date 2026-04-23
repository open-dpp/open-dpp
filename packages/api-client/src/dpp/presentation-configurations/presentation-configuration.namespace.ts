import type {
  PresentationConfigurationDto,
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

  public async get(id: string) {
    return await this.axiosInstance.get<PresentationConfigurationDto>(
      `${this.basePath}/${id}/presentation-configuration`,
    );
  }

  public async patch(id: string, data: PresentationConfigurationPatchDto) {
    return await this.axiosInstance.patch<PresentationConfigurationDto>(
      `${this.basePath}/${id}/presentation-configuration`,
      data,
    );
  }
}
