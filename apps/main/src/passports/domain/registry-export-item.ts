import { PermalinkKind } from "@open-dpp/dto";
import { Permalink } from "../../permalink/domain/permalink";

export class RegistryExportItem {
  private constructor(public readonly uniqueProductIdentifier: string) {}

  static create(data: { uniqueProductIdentifier: string }): RegistryExportItem {
    return new RegistryExportItem(data.uniqueProductIdentifier);
  }

  /**
   * Builds the item of one passport from its permalinks. The identifier is the published URL of
   * the oldest GS1 permalink if there is one, otherwise of the oldest open-dpp permalink.
   * Returns undefined if there is no such permalink or it has no published URL.
   */
  static fromPermalinks(permalinks: ReadonlyArray<Permalink>): RegistryExportItem | undefined {
    const oldestFirst = [...permalinks].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
    );
    const permalink =
      oldestFirst.find((candidate) => candidate.kind === PermalinkKind.GS1_LINK) ?? oldestFirst[0];
    return permalink?.publishedUrl
      ? RegistryExportItem.create({ uniqueProductIdentifier: permalink.publishedUrl })
      : undefined;
  }

  toPlain() {
    return { uniqueProductIdentifier: this.uniqueProductIdentifier };
  }
}
