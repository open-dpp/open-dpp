import { ReferenceElement } from "../submodel-base/reference-element";
import { IdShortPath } from "../submodel-base/submodel-base";

export function createAasObject(path: IdShortPath): ReferenceElement {
  return ReferenceElement.create({ idShort: path.toString() });
}
