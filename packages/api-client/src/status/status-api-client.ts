import type { AxiosInstance, AxiosResponse } from "axios";
import type { ApiClientOptions, IApiClient } from "../api-client";
import { createAxiosClient } from "../api-client";
import { DEFAULT_API_URL } from "../urls";

export class StatusApiClient implements IApiClient {
  private axiosInstance!: AxiosInstance;
  private options: ApiClientOptions;

  constructor(options: ApiClientOptions = {}) {
    this.options = options;
    this.createNewAxiosInstance();
  }

  public setApiKey(apiKey: string) {
    this.options.apiKey = apiKey;
    this.createNewAxiosInstance();
  }

  public setActiveOrganizationId(id: string) {
    this.options.activeOrganizationId = id;
    this.createNewAxiosInstance();
  }

  public async get(): Promise<AxiosResponse<{ version: string }>> {
    return this.axiosInstance.get<{ version: string }>("/status");
  }

  private createNewAxiosInstance() {
    this.axiosInstance = createAxiosClient(this.options, DEFAULT_API_URL);
  }
}
