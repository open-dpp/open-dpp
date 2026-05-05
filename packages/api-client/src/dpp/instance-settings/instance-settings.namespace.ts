import type { AxiosInstance } from "axios";
import type {
  InstanceSettingsDto,
  InstanceSettingsUpdateDto,
  PublicInstanceSettingsDto,
} from "@open-dpp/dto";

export class InstanceSettingsNamespace {
  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async get() {
    return this.axiosInstance.get<InstanceSettingsDto>("/instance-settings");
  }

  public async update(data: InstanceSettingsUpdateDto) {
    return this.axiosInstance.patch<InstanceSettingsDto>("/instance-settings", data);
  }

  public async getPublic() {
    return this.axiosInstance.get<PublicInstanceSettingsDto>("/instance-settings/public");
  }
}
