import { IdShortPath } from "../common/id-short-path";
import { ISubmodelBase } from "./submodel-base";
import { Reference } from "../common/reference";
import { Key } from "../common/key";
import { ReferenceTypes } from "@open-dpp/dto";

export class Pointer {
  private constructor(
    private parentIdShortPath: IdShortPath | null,
    private parentReference: Reference | null,
  ) {}

  static create(data: { parentIdShortPath?: IdShortPath; parentReference?: Reference }): Pointer {
    return new Pointer(data.parentIdShortPath ?? null, data.parentReference ?? null);
  }

  getIdShortPathToElement(element: ISubmodelBase): IdShortPath {
    return this.parentIdShortPath
      ? this.parentIdShortPath.addPathSegment(element.idShort)
      : IdShortPath.create({ path: element.idShort });
  }

  getPointerToElement(element: ISubmodelBase): Pointer {
    return Pointer.create({
      parentIdShortPath: this.getIdShortPathToElement(element),
      parentReference: this.getReferenceToElement(element),
    });
  }

  getReferenceToElement(element: ISubmodelBase): Reference {
    const keyOfElement = Key.create({ type: element.getKeyType(), value: element.idShort });
    return this.parentReference
      ? this.parentReference.addKey(keyOfElement)
      : Reference.create({ type: ReferenceTypes.ModelReference, keys: [keyOfElement] });
  }

  setParentPointersOfSubmodelElements(submodelBase: ISubmodelBase): void {
    const parentPointer = this.getPointerToElement(submodelBase);

    submodelBase
      .getSubmodelElements()
      .forEach((element) => element.setParentPointer(parentPointer));
  }
}
