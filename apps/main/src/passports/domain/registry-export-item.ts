import { Permalink } from "../../permalink/domain/permalink";

export class RegistryExportItem {
  private constructor(public readonly uniqueProductIdentifier: string) {}

  static create(data: { uniqueProductIdentifier: string }): RegistryExportItem {
    return new RegistryExportItem(data.uniqueProductIdentifier);
  }

  /**
   * Builds the item of one passport from its permalinks. The identifier is the published URL of
   * the oldest permalink (by createdAt), so repeated exports always choose the same one.
   * Temporary heuristic until permalinks have an official flag marking the one for the EU.
   * Returns undefined if there is no permalink or the oldest one has no published URL.
   */
  static fromPermalinks(permalinks: ReadonlyArray<Permalink>): RegistryExportItem | undefined {
    const [permalink] = [...permalinks].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
    );
    return permalink?.publishedUrl
      ? RegistryExportItem.create({ uniqueProductIdentifier: permalink.publishedUrl })
      : undefined;
  }

  toPlain() {
    return { uniqueProductIdentifier: this.uniqueProductIdentifier };
  }
}
