import { ModifierVisitorOptions } from "../modifier-visitor";
import { AddOptions, DeleteOptions, ISubmodelElement } from "./submodel-base";
import { SubmodelElementList } from "./submodel-element-list";
import { ChangeTracker, withTrackingHelper } from "../../../activity-history/domain/change-tracker";
import { ITableExtendable } from "./table-extensable";
import { IdShortPath } from "../common/id-short-path";
import { TableExtension } from "./table-extension";
import { KeyTypes } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";

export class NestedTableExtension implements ITableExtendable {
  readonly tracker = ChangeTracker.create();

  private constructor(
    private data: SubmodelElementList,
    private readonly findSubmodelElementOrFailCallback: (
      idShortPath: IdShortPath,
    ) => ISubmodelElement,
  ) {}

  static create(params: {
    data: SubmodelElementList;
    findSubmodelElementOrFailCallback: (idShortPath: IdShortPath) => ISubmodelElement;
  }) {
    return new NestedTableExtension(params.data, params.findSubmodelElementOrFailCallback);
  }

  withTracking(changeTracker?: ChangeTracker): this {
    return withTrackingHelper(changeTracker, this);
  }

  private performRecursive(operation: (tableExtension: TableExtension) => void) {
    const idShortPath = this.data.getIdShortPath().slice(1);
    const paths = this.data
      .getReference()
      .constructIdShortPathsForType(KeyTypes.SubmodelElementList, { excludeSubmodel: true })
      .filter((path: IdShortPath) => !path.isEqual(idShortPath));
    const affectedParentRowPaths = this.collectAffectedParentRowPaths(paths);
    for (const path of affectedParentRowPaths) {
      if (idShortPath.last) {
        const tableExtension = this.getListAsTableExtensionOrFail(
          path.addPathSegment(idShortPath.last),
        );
        operation(tableExtension.withTracking(this.tracker));
      }
    }
  }

  addColumn(column: ISubmodelElement, options: AddOptions): void {
    this.performRecursive((tableExtension) => {
      tableExtension.addColumn(column, options);
    });
  }

  modifyColumn(idShort: string, data: any, options: ModifierVisitorOptions) {
    this.performRecursive((tableExtension) => {
      tableExtension.modifyColumn(idShort, data, options);
    });
  }

  getListAsTableExtensionOrFail(idShortPath: IdShortPath): TableExtension {
    const submodelElement = this.findSubmodelElementOrFailCallback(idShortPath);
    if (submodelElement instanceof SubmodelElementList) {
      return new TableExtension(submodelElement).withTracking(this.tracker);
    } else {
      throw new ValueError(
        `Cannot create table for submodel element with type ${submodelElement.getSubmodelElementType()}`,
      );
    }
  }

  deleteColumn(idShort: string, options: DeleteOptions) {}

  addRow(options: AddOptions) {}

  deleteRow(idShort: string, options: DeleteOptions) {}

  getTableElement(): SubmodelElementList {
    return this.data;
  }

  collectAffectedParentRowPaths(
    tablePaths: IdShortPath[],
    currentPath: IdShortPath | undefined = undefined,
    currentTableIndex = 0,
  ): IdShortPath[] {
    const currentPathWithoutSection = currentPath ? currentPath.slice(1) : undefined;
    if (tablePaths[currentTableIndex] && tablePaths[currentTableIndex].last) {
      const currentTablePath = currentPathWithoutSection
        ? currentPathWithoutSection.addPathSegment(tablePaths[currentTableIndex].last)
        : tablePaths[currentTableIndex];
      const table = this.getListAsTableExtensionOrFail(currentTablePath);
      const rows = table.rows;
      const result: IdShortPath[] = [];
      for (const row of rows) {
        result.push(
          ...this.collectAffectedParentRowPaths(
            tablePaths,
            row.getIdShortPath(),
            currentTableIndex + 1,
          ),
        );
      }
      return result;
    } else if (currentPathWithoutSection) {
      return [currentPathWithoutSection];
    }
    return [];
  }
}
