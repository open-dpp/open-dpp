import { Resource } from "./resource";
import { SpecificAssetId } from "./specific-asset-id";

export class AssetInformation {
  private constructor(
    public readonly assetKind: AssetKind,
    public readonly globalAssetId: string | null = null,
    public readonly specificAssetIds: Array<SpecificAssetId> | null = null,
    public readonly assetType: string | null = null,
    public defaultThumbnail: Resource | null = null,
  ) {
  }

  static create(data: {
    assetKind: AssetKind;
    globalAssetId?: string;
    specificAssetIds?: Array<SpecificAssetId>;
    assetType?: string;
    defaultThumbnail?: Resource;
  }) {
    return new AssetInformation(
      data.assetKind,
      data.globalAssetId ?? null,
      data.specificAssetIds ?? null,
      data.assetType ?? null,
      data.defaultThumbnail ?? null,
    );
  }
}

export enum AssetKind {
  Type = "Type",
  Instance = "Instance",
}
