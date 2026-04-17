import type {
  DigitalProductDocumentStatusModificationDto,
  DigitalProductDocumentDto,
} from "@open-dpp/dto";
import type { AxiosResponse } from "axios";

export interface IDigitalProductDocumentNamespace {
  getById(id: string): Promise<AxiosResponse<DigitalProductDocumentDto>>;
  deleteById(id: string): Promise<AxiosResponse<void>>;
  modifyStatus(
    id: string,
    data: DigitalProductDocumentStatusModificationDto,
  ): Promise<AxiosResponse<DigitalProductDocumentDto>>;
}
