import type {
  ActivityPaginationDto,
  DigitalProductDocumentDto,
  DigitalProductDocumentStatusModificationDto,
  PagingParamsDto,
} from "@open-dpp/dto";
import type { AxiosResponse } from "axios";

export type ActivityParams = { pagination: PagingParamsDto };

export interface IDigitalProductDocumentNamespace {
  getById(id: string): Promise<AxiosResponse<DigitalProductDocumentDto>>;
  deleteById(id: string): Promise<AxiosResponse<void>>;
  modifyStatus(
    id: string,
    data: DigitalProductDocumentStatusModificationDto,
  ): Promise<AxiosResponse<DigitalProductDocumentDto>>;
  getActivities(id: string, params: ActivityParams): Promise<AxiosResponse<ActivityPaginationDto>>;
}
