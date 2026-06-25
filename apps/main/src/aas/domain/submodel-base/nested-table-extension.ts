import { ModifierVisitorOptions } from "../modifier-visitor";
import {
  AddOptions,
  DeleteOptions,
  ISubmodelElement,
  ISubmodelElementSearchable,
} from "./submodel-base";
import { SubmodelElementList } from "./submodel-element-list";
import { ChangeTracker, withTrackingHelper } from "../../../activity-history/domain/change-tracker";
import { ITableExtendable, parseAsSubmodelElementListOrFail } from "./table-extensable";
import { IdShortPath } from "../common/id-short-path";
import { TableExtension } from "./table-extension";
import { KeyTypes } from "@open-dpp/dto";

export class NestedTableExtension implements ITableExtendable {
  readonly tracker = ChangeTracker.create();

  private constructor(
    private data: SubmodelElementList,
    private readonly submodelElementSearch: ISubmodelElementSearchable,
  ) {}

  static create(params: {
    data: SubmodelElementList;
    submodelElementSearch: ISubmodelElementSearchable;
  }) {
    return new NestedTableExtension(params.data, params.submodelElementSearch);
  }

  withTracking(changeTracker?: ChangeTracker): this {
    return withTrackingHelper(changeTracker, this);
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

  deleteColumn(idShort: string, options: DeleteOptions) {
    this.performRecursive((tableExtension) => {
      tableExtension.deleteColumn(idShort, options);
    });
  }

  addRow(options: AddOptions) {
    new TableExtension(this.data).withTracking(this.tracker).addRow(options);
  }

  deleteRow(idShort: string, options: DeleteOptions) {}

  getTableElement(): SubmodelElementList {
    return this.data;
  }

  private performRecursive(operation: (tableExtension: TableExtension) => void) {
    const idShortPath = this.data.getIdShortPath().slice(1);
    const parentTablePaths = this.data
      .getReference()
      .constructIdShortPathsForType(KeyTypes.SubmodelElementList, { excludeSubmodel: true })
      .filter((path: IdShortPath) => !path.isEqual(idShortPath));
    const affectedParentRowPaths = this.collectAffectedParentRowPaths(parentTablePaths);
    for (const path of affectedParentRowPaths) {
      if (idShortPath.last) {
        const tableExtension = this.getListAsTableExtensionOrFail(
          path.addPathSegment(idShortPath.last),
        );
        operation(tableExtension.withTracking(this.tracker));
      }
    }
  }

  private getListAsTableExtensionOrFail(idShortPath: IdShortPath): TableExtension {
    const submodelElement = parseAsSubmodelElementListOrFail(
      this.submodelElementSearch.findSubmodelElementOrFail(idShortPath),
    );
    return new TableExtension(submodelElement);
  }

  private collectAffectedParentRowPaths(
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
