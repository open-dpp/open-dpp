import type {
  ActivityPaginationDto,
  DigitalProductDocumentStatusModificationDto,
  GetAllActivitiesParamsDto,
  GetAllParamsDto,
  PassportDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
  PermalinkPaginationDto,
  UniqueProductIdentifierPaginationDto,
} from "@open-dpp/dto";
import type { AxiosInstance, AxiosResponse } from "axios";

export interface PassportListParams {
  limit?: number;
  cursor?: string;
}

import { AasNamespace } from "../aas/aasNamespace";
import {
  parseGetAllActivitiesParams,
  parseGetAllParams,
} from "../digital-product-document/parse-get-all-params";
import { PresentationConfigurationNamespace } from "../presentation-configurations/presentation-configuration.namespace";
import type {
  DownloadActivityParams,
  IDigitalProductDocumentNamespace,
} from "../digital-product-document/digital-product-document.namespace";

export class PassportNamespace implements IDigitalProductDocumentNamespace {
  public aas!: AasNamespace;
  public presentationConfiguration!: PresentationConfigurationNamespace;
  private readonly passportEndpoint = "/passports";

  constructor(private readonly axiosInstance: AxiosInstance) {
    this.aas = new AasNamespace(this.axiosInstance, "passports");
    this.presentationConfiguration = new PresentationConfigurationNamespace(
      this.axiosInstance,
      "passports",
    );
  }

  public async getAll(params: GetAllParamsDto) {
    return await this.axiosInstance.get<PassportPaginationDto>(this.passportEndpoint, {
      params: parseGetAllParams(params),
      paramsSerializer: {
        indexes: null, // {populate: ['assetAdministrationShell', 'submodels']} is converted to query params ?populate=assetAdministrationShell&populate=submodels
      },
    });
  }

  public async getById(id: string) {
    return await this.axiosInstance.get<PassportDto>(`${this.passportEndpoint}/${id}`);
  }

  public async create(data: PassportRequestCreateDto): Promise<AxiosResponse<PassportDto>> {
    return await this.axiosInstance.post<PassportDto>(this.passportEndpoint, data);
  }

  public async getUniqueProductIdentifierOfPassport(passportId: string) {
    return await this.axiosInstance.get<{ uuid: string }>(
      `${this.passportEndpoint}/${passportId}/unique-product-identifier`,
    );
  }

  /**
   * Passport-scoped permalink list (presentation + gs1-link union), cursor
   * paginated. Returns the standard `{ paging_metadata, result }` envelope. This
   * is what the per-passport backoffice list view calls — the org-scoped
   * `/permalinks` endpoint is kept for API consumers only.
   */
  public async getPermalinks(passportId: string, params?: PassportListParams) {
    const url = `${this.passportEndpoint}/${encodeURIComponent(passportId)}/permalinks`;
    if (params) {
      return await this.axiosInstance.get<PermalinkPaginationDto>(url, { params });
    }
    return await this.axiosInstance.get<PermalinkPaginationDto>(url);
  }

  /**
   * Passport-scoped UPI list (OPEN_DPP_UUID + GS1), cursor paginated. Returns the
   * standard `{ paging_metadata, result }` envelope. This is what the per-passport
   * backoffice list view calls — the org-scoped `/unique-product-identifiers`
   * endpoint is kept for API consumers only.
   */
  public async getUniqueProductIdentifiers(passportId: string, params?: PassportListParams) {
    const url = `${this.passportEndpoint}/${encodeURIComponent(passportId)}/unique-product-identifiers`;
    if (params) {
      return await this.axiosInstance.get<UniqueProductIdentifierPaginationDto>(url, { params });
    }
    return await this.axiosInstance.get<UniqueProductIdentifierPaginationDto>(url);
  }

  public async deleteById(id: string) {
    return await this.axiosInstance.delete<void>(`${this.passportEndpoint}/${id}`);
  }

  public async modifyStatus(
    id: string,
    data: DigitalProductDocumentStatusModificationDto,
  ): Promise<AxiosResponse<PassportDto>> {
    return await this.axiosInstance.put<PassportDto>(`${this.passportEndpoint}/${id}/status`, data);
  }

  async getActivities(
    id: string,
    params: GetAllActivitiesParamsDto,
  ): Promise<AxiosResponse<ActivityPaginationDto>> {
    return this.axiosInstance.get<ActivityPaginationDto>(
      `${this.passportEndpoint}/${id}/activities`,
      {
        params: parseGetAllActivitiesParams(params),
        paramsSerializer: {
          indexes: null, // {populate: ['assetAdministrationShell', 'submodels']} is converted to query params ?populate=assetAdministrationShell&populate=submodels
        },
      },
    );
  }

  downloadActivities(id: string, params: DownloadActivityParams): Promise<AxiosResponse<Blob>> {
    return this.axiosInstance.get(`${this.passportEndpoint}/${id}/activities/download`, {
      responseType: "blob",
      params: { ...params.period },
    });
  }
}
