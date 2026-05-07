import type {
  ActivityPaginationDto,
  DigitalProductDocumentStatusModificationDto,
  GetAllActivitiesParamsDto,
  GetAllParamsDto,
  PassportDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
} from "@open-dpp/dto";
import type { AxiosInstance, AxiosResponse } from "axios";

import { AasNamespace } from "../aas/aasNamespace";
import { parseGetAllParams } from "../digital-product-document/parse-get-all-params";
import type {
  DownloadActivityParams,
  IDigitalProductDocumentNamespace,
} from "../digital-product-document/digital-product-document.namespace";

export class PassportNamespace implements IDigitalProductDocumentNamespace {
  public aas!: AasNamespace;
  private readonly passportEndpoint = "/passports";

  constructor(private readonly axiosInstance: AxiosInstance) {
    this.aas = new AasNamespace(this.axiosInstance, "passports");
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
        params: { ...params.pagination, ...params.period },
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
