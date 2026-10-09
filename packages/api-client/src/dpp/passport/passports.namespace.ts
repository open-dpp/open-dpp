import type {
  ActivityPaginationDto,
  DigitalProductDocumentStatusModificationDto,
  GetAllActivitiesParamsDto,
  GetAllPassportsParamsDto,
  PassportDto,
  PassportPaginationDto,
  PassportRegistryExportRequestDto,
  PassportRequestCreateDto,
  PermalinkPaginationDto,
  RemoveEditingRestrictionsDto,
  UniqueProductIdentifierPaginationDto,
} from "@open-dpp/dto";
import type { AxiosInstance, AxiosResponse } from "axios";

import { AasNamespace } from "../aas/aasNamespace";
import type { CursorListParams } from "../cursor-list-params";
import {
  parseGetAllActivitiesParams,
  parseGetAllPassportsParams,
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

  public async getAll(params: GetAllPassportsParamsDto) {
    return await this.axiosInstance.get<PassportPaginationDto>(this.passportEndpoint, {
      params: parseGetAllPassportsParams(params),
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

  /** Published passports as ZIP of EU registry files, see POST /passports/export-to-registry. */
  public async exportToRegistry(
    data: PassportRegistryExportRequestDto,
  ): Promise<AxiosResponse<Blob>> {
    return await this.axiosInstance.post(`${this.passportEndpoint}/export-to-registry`, data, {
      responseType: "blob",
    });
  }

  public async getPermalinks(passportId: string, params?: CursorListParams) {
    const url = `${this.passportEndpoint}/${encodeURIComponent(passportId)}/permalinks`;
    return await this.axiosInstance.get<PermalinkPaginationDto>(url, { params });
  }

  public async getUniqueProductIdentifiers(passportId: string, params?: CursorListParams) {
    const url = `${this.passportEndpoint}/${encodeURIComponent(passportId)}/unique-product-identifiers`;
    return await this.axiosInstance.get<UniqueProductIdentifierPaginationDto>(url, { params });
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

  public async setEditingMode(
    id: string,
    data: RemoveEditingRestrictionsDto,
  ): Promise<AxiosResponse<PassportDto>> {
    return await this.axiosInstance.put<PassportDto>(
      `${this.passportEndpoint}/${id}/editing-mode`,
      data,
    );
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
