import { AssetKindType } from "./asset-kind-enum";
import { AssetInformationJsonSchema } from "./parsing/asset-information-json-schema";
import { Resource } from "./resource";
import { SpecificAssetId } from "./specific-asset-id";
import { IVisitable, IVisitor } from "./visitor";

export class AssetInformation implements IVisitable<any> {
  private constructor(
    public readonly assetKind: AssetKindType,
    public readonly globalAssetId: string | null = null,
    public readonly specificAssetIds: Array<SpecificAssetId>,
    public readonly assetType: string | null = null,
    public defaultThumbnail: Resource | null = null,
  ) {
  }

  static create(data: {
    assetKind: AssetKindType;
    globalAssetId?: string;
    specificAssetIds?: Array<SpecificAssetId>;
    assetType?: string;
    defaultThumbnail?: Resource;
  }) {
    return new AssetInformation(
      data.assetKind,
      data.globalAssetId ?? null,
      data.specificAssetIds ?? [],
      data.assetType ?? null,
      data.defaultThumbnail ?? null,
    );
  }

  static fromPlain(data: unknown): AssetInformation {
    const parsed = AssetInformationJsonSchema.parse(data);
    return AssetInformation.create({
      assetKind: parsed.assetKind,
      globalAssetId: parsed.globalAssetId,
      specificAssetIds: parsed.specificAssetIds.map(SpecificAssetId.fromPlain),
      assetType: parsed.assetType,
      defaultThumbnail: parsed.defaultThumbnail ? Resource.fromPlain(parsed.defaultThumbnail) : undefined,
    });
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitAssetInformation(this);
  }
}
