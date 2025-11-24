import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Qualifier } from "./common/qualififiable";
import { Reference } from "./common/reference";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import { Property } from "./submodelBase/property";

export interface IVisitor<R> {
  visitProperty: (element: Property) => R;
  visitLanguageText: (element: LanguageText) => R;
  visitReference: (element: Reference) => R;
  visitKey: (element: Key) => R;
  visitQualifier: (element: Qualifier) => R;
  visitEmbeddedDataSpecification: (element: EmbeddedDataSpecification) => R;
  visitExtension: (element: Extension) => R;
}

export interface IVisitable<R> {
  accept: (visitor: IVisitor<R>) => R;
}
