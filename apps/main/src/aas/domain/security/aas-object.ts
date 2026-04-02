import { IdShortPath } from "../common/id-short-path";

import { ReferenceElement } from "../submodel-base/reference-element";

export function createAasObject(path: IdShortPath): ReferenceElement {
  return ReferenceElement.create({ idShort: path.toString() });
}
