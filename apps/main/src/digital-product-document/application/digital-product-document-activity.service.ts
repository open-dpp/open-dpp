import { ActivityRepository } from "../../activity-history/infrastructure/activity.repository";
import { Pagination } from "../../pagination/pagination";
import { Injectable } from "@nestjs/common";
import { IDigitalProductDocument } from "../domain/digital-product-document";
import { ActivityPaginationDtoSchema } from "@open-dpp/dto";

@Injectable()
export class DigitalProductDocumentActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async getActivities<T extends IDigitalProductDocument>(
    digitalProductDocument: T,
    limit: number = 10,
    cursor: string | undefined,
  ) {
    const pagination = Pagination.create({ limit, cursor });
    return ActivityPaginationDtoSchema.parse(
      (
        await this.activityRepository.findByAggregateId(digitalProductDocument.id, {
          pagination,
        })
      ).toPlain(),
    );
  }
}
