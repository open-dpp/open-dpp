import { AssetInformationJsonSchema, AssetKindType } from "@open-dpp/dto";
import { Resource } from "./resource";
import { SpecificAssetId } from "./specific-asset-id";
import { IVisitable, IVisitor } from "./visitor";

export class AssetInformation implements IVisitable {
  private constructor(
    public readonly assetKind: AssetKindType,
    public globalAssetId: string | null = null,
    public readonly specificAssetIds: Array<SpecificAssetId>,
    public readonly assetType: string | null = null,
    public defaultThumbnails: Resource[],
  ) {
  }

  static create(data: {
    assetKind: AssetKindType;
    globalAssetId?: string | null;
    specificAssetIds?: Array<SpecificAssetId>;
    assetType?: string | null;
    defaultThumbnails?: Resource[];
  }) {
    return new AssetInformation(
      data.assetKind,
      data.globalAssetId ?? null,
      data.specificAssetIds ?? [],
      data.assetType ?? null,
      data.defaultThumbnails ?? [],
    );
  }

  static fromPlain(data: unknown): AssetInformation {
    const parsed = AssetInformationJsonSchema.parse(data);
    return new AssetInformation(
      parsed.assetKind,
      parsed.globalAssetId,
      parsed.specificAssetIds.map(SpecificAssetId.fromPlain),
      parsed.assetType,
      parsed.defaultThumbnails.map(Resource.fromPlain),
    );
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitAssetInformation(this, context);
  }
}
