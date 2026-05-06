import type {
  ActivityPaginationDto,
  DigitalProductDocumentStatusModificationDto,
  GetAllParamsDto,
  TemplateCreateDto,
  TemplateDto,
  TemplatePaginationDto,
} from "@open-dpp/dto";
import type { AxiosInstance, AxiosResponse } from "axios";
import { AasNamespace } from "../aas/aasNamespace";
import { parseGetAllParams } from "../digital-product-document/parse-get-all-params";
import type {
  ActivityParams,
  IDigitalProductDocumentNamespace,
} from "../digital-product-document/digital-product-document.namespace";

export class TemplatesNamespace implements IDigitalProductDocumentNamespace {
  public aas!: AasNamespace;
  private readonly templatesEndpoint = "/templates";

  constructor(private readonly axiosInstance: AxiosInstance) {
    this.aas = new AasNamespace(this.axiosInstance, "templates");
  }

  public async getAll(params: GetAllParamsDto) {
    return await this.axiosInstance.get<TemplatePaginationDto>(this.templatesEndpoint, {
      params: parseGetAllParams(params),
      paramsSerializer: {
        indexes: null, // {populate: ['assetAdministrationShell', 'submodels']} is converted to query params ?populate=assetAdministrationShell&populate=submodels
      },
    });
  }

  public async getById(id: string) {
    return await this.axiosInstance.get<TemplateDto>(`${this.templatesEndpoint}/${id}`);
  }

  public async create(data: TemplateCreateDto): Promise<AxiosResponse<TemplateDto>> {
    return await this.axiosInstance.post<TemplateDto>(this.templatesEndpoint, data);
  }

  public async export(id: string) {
    return await this.axiosInstance.get<Record<string, unknown>>(
      `${this.templatesEndpoint}/${id}/export`,
    );
  }

  public async import(data: Record<string, unknown>): Promise<AxiosResponse<TemplateDto>> {
    return await this.axiosInstance.post<TemplateDto>(`${this.templatesEndpoint}/import`, data);
  }

  public async deleteById(id: string) {
    return await this.axiosInstance.delete(`${this.templatesEndpoint}/${id}`);
  }

  public async modifyStatus(
    id: string,
    data: DigitalProductDocumentStatusModificationDto,
  ): Promise<AxiosResponse<TemplateDto>> {
    return await this.axiosInstance.put<TemplateDto>(
      `${this.templatesEndpoint}/${id}/status`,
      data,
    );
  }

  async getActivities(
    id: string,
    params: ActivityParams,
  ): Promise<AxiosResponse<ActivityPaginationDto>> {
    return this.axiosInstance.get<ActivityPaginationDto>(
      `${this.templatesEndpoint}/${id}/activities`,
      {
        params: { ...params.pagination },
      },
    );
  }

  downloadActivities(id: string, params: ActivityParams): Promise<AxiosResponse<Blob>> {
    return this.axiosInstance.get(`${this.templatesEndpoint}/${id}/activities/download`, {
      responseType: "blob",
      params: { ...params.pagination },
    });
  }
}
