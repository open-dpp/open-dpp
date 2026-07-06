import { type ApiVersionsDtoType, type SubmodelModificationDto } from "@open-dpp/dto";

export class SubmodelModificationRequest {
  private constructor(
    private readonly body: SubmodelModificationDto,
    public readonly version: ApiVersionsDtoType,
  ) {}
  static create(data: { body: SubmodelModificationDto; version: ApiVersionsDtoType }) {
    return new SubmodelModificationRequest(data.body, data.version);
  }

  toDomain(): SubmodelModificationDto {
    return this.body;
  }
}
