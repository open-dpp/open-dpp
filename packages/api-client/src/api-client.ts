import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { ApiVersionsDtoType, LatestApiVersionDto } from "@open-dpp/dto";

export interface IApiClient {
  setApiKey: (apiKey: string) => void;
  setActiveOrganizationId: (id: string) => void;
}

export interface ApiClientOptions extends AxiosRequestConfig {
  apiKey?: string;
  serviceToken?: string;
  activeOrganizationId?: string;
  version?: ApiVersionsDtoType;
}

export function createAxiosClient(options: ApiClientOptions, defaultBaseUrl: string) {
  const baseURL = `${options.baseURL ?? defaultBaseUrl}/v${options.version ?? LatestApiVersionDto}`;
  return axios.create({
    ...options,
    baseURL,
    withCredentials: true,
    headers: {
      ...options.headers,
      service_token: options.serviceToken ? options.serviceToken : "",
      "x-api-key": options.apiKey ? options.apiKey : "",
      ...(options.activeOrganizationId
        ? { "X-OPEN-DPP-ORGANIZATION-ID": options.activeOrganizationId }
        : {}),
    },
  });
}
