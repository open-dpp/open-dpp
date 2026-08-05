import type {
  BulkImportConfigCreateDto,
  BulkImportConfigDto,
  BulkImportConfigPaginationDto,
  BulkImportConfigUpdateDto,
  BulkImportParseResultDto,
  BulkImportRunCreateDto,
  BulkImportRunDto,
  BulkImportRunItemPaginationDto,
  BulkImportRunPaginationDto,
  PagingParamsDto,
} from "@open-dpp/dto";
import type { AxiosInstance } from "axios";

export class BulkImportNamespace {
  private readonly configEndpoint = "/bulk-import/configs";
  private readonly runEndpoint = "/bulk-import/runs";

  constructor(private readonly axiosInstance: AxiosInstance) {}

  public async createConfig(data: BulkImportConfigCreateDto) {
    return await this.axiosInstance.post<BulkImportConfigDto>(this.configEndpoint, data);
  }

  public async getConfigs(templateId?: string) {
    return await this.axiosInstance.get<BulkImportConfigPaginationDto>(this.configEndpoint, {
      params: templateId ? { templateId } : undefined,
    });
  }

  public async getConfigById(id: string) {
    return await this.axiosInstance.get<BulkImportConfigDto>(`${this.configEndpoint}/${id}`);
  }

  public async updateConfig(id: string, data: BulkImportConfigUpdateDto) {
    return await this.axiosInstance.put<BulkImportConfigDto>(`${this.configEndpoint}/${id}`, data);
  }

  public async deleteConfig(id: string) {
    return await this.axiosInstance.delete<void>(`${this.configEndpoint}/${id}`);
  }

  public async createRun(configId: string, data: BulkImportRunCreateDto) {
    return await this.axiosInstance.post<BulkImportRunDto>(
      `${this.configEndpoint}/${configId}/runs`,
      data,
    );
  }

  public async createRunUpload(configId: string, file: File | Blob) {
    const formData = new FormData();
    formData.append("file", file);
    return await this.axiosInstance.post<BulkImportRunDto>(
      `${this.configEndpoint}/${configId}/runs/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  }

  public async parseFile(file: File | Blob) {
    const formData = new FormData();
    formData.append("file", file);
    return await this.axiosInstance.post<BulkImportParseResultDto>(
      `/bulk-import/parse-file`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  }

  public async getRunsForConfig(configId: string, params?: PagingParamsDto) {
    return await this.axiosInstance.get<BulkImportRunPaginationDto>(
      `${this.configEndpoint}/${configId}/runs`,
      { params },
    );
  }

  public async getRunById(id: string) {
    return await this.axiosInstance.get<BulkImportRunDto>(`${this.runEndpoint}/${id}`);
  }

  public async getRunItems(id: string, params?: PagingParamsDto) {
    return await this.axiosInstance.get<BulkImportRunItemPaginationDto>(
      `${this.runEndpoint}/${id}/items`,
      { params },
    );
  }

  public async interruptRun(id: string) {
    return await this.axiosInstance.post<BulkImportRunDto>(`${this.runEndpoint}/${id}/interrupt`);
  }
}
