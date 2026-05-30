import type {
  DigitalProductDocumentStatusModificationDto,
  GetAllParamsDto,
  Gs1IdentityRequest,
  Gs1IdentityResponse,
  PassportDto,
  PassportPaginationDto,
  PassportRequestCreateDto,
} from "@open-dpp/dto";
import type { AxiosInstance, AxiosResponse } from "axios";

import { AasNamespace } from "../aas/aasNamespace";
import { type IDigitalProductDocumentNamespace } from "../digital-product-document/digital-product-document.namespace";
import { parseGetAllParams } from "../digital-product-document/parse-get-all-params";
import { PresentationConfigurationNamespace } from "../presentation-configurations/presentation-configuration.namespace";

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

  public async getGs1Identity(passportId: string) {
    return await this.axiosInstance.get<Gs1IdentityResponse>(
      `${this.passportEndpoint}/${passportId}/gs1-identity`,
    );
  }

  public async setGs1Identity(passportId: string, data: Gs1IdentityRequest) {
    return await this.axiosInstance.put<Gs1IdentityResponse>(
      `${this.passportEndpoint}/${passportId}/gs1-identity`,
      data,
    );
  }

  public async deleteGs1Identity(passportId: string) {
    return await this.axiosInstance.delete<void>(
      `${this.passportEndpoint}/${passportId}/gs1-identity`,
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
}
