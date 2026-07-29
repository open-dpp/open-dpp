import { IdShortPath } from "../../domain/common/id-short-path";

export type DeleteSubmodelBaseEvent = {
  pathToDelete: IdShortPath;
};
export type MoveSubmodelBaseEvent = {
  oldPath: IdShortPath;
  newPath: IdShortPath;
};
