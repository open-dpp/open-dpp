import { type ApiVersionsDtoType, type MoveSubmodelElementDto } from "@open-dpp/dto";
import { IdShortPath } from "../../domain/common/id-short-path";

export class MoveSubmodelElementRequest {
  private constructor(
    private readonly body: MoveSubmodelElementDto,
    public readonly version: ApiVersionsDtoType,
  ) {}
  static create(data: { body: MoveSubmodelElementDto; version: ApiVersionsDtoType }) {
    return new MoveSubmodelElementRequest(data.body, data.version);
  }

  toDomain(): { targetParentPath?: IdShortPath; position?: number } {
    return {
      targetParentPath: this.body.targetParentIdShortPath
        ? IdShortPath.create({ path: this.body.targetParentIdShortPath })
        : undefined,
      position: this.body.position,
    };
  }
}
