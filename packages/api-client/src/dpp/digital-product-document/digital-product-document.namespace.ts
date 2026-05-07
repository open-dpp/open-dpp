import type {
  ActivityPaginationDto,
  DigitalProductDocumentDto,
  DigitalProductDocumentStatusModificationDto,
  GetAllActivitiesParamsDto,
  PeriodDto,
} from "@open-dpp/dto";
import type { AxiosResponse } from "axios";

export type DownloadActivityParams = { period: PeriodDto };

export interface IDigitalProductDocumentNamespace {
  getById(id: string): Promise<AxiosResponse<DigitalProductDocumentDto>>;
  deleteById(id: string): Promise<AxiosResponse<void>>;
  modifyStatus(
    id: string,
    data: DigitalProductDocumentStatusModificationDto,
  ): Promise<AxiosResponse<DigitalProductDocumentDto>>;
  getActivities(
    id: string,
    params: GetAllActivitiesParamsDto,
  ): Promise<AxiosResponse<ActivityPaginationDto>>;
  downloadActivities(id: string, params: DownloadActivityParams): Promise<AxiosResponse<Blob>>;
}
