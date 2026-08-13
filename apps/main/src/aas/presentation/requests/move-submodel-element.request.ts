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
    const raw = this.body.targetParentIdShortPath;
    let targetParentPath: IdShortPath | undefined;
    if (raw === undefined) {
      targetParentPath = undefined; // keep the current parent
    } else if (raw === null) {
      targetParentPath = IdShortPath.fromSegments([]); // move to the Submodel root
    } else {
      targetParentPath = IdShortPath.create({ path: raw });
    }
    return { targetParentPath, position: this.body.position };
  }
}
