import { Key, KeyTypes } from "../domain/common/key";
import { LanguageText } from "../domain/common/language-text";
import { Qualifier } from "../domain/common/qualififiable";
import { Reference } from "../domain/common/reference";
import { EmbeddedDataSpecification } from "../domain/embedded-data-specification";
import { Extension } from "../domain/extension";
import { Property } from "../domain/submodelBase/property";
import { SubmodelBase } from "../domain/submodelBase/submodel";
import { IVisitor } from "../domain/visitor";

export class DbVisitor implements IVisitor<any> {
  private buildBase(submodelBase: SubmodelBase) {
    return {
      category: submodelBase.category,
      idShort: submodelBase.idShort,
      displayName: submodelBase.displayName.map(lt => lt.accept(this)),
      description: submodelBase.description.map(lt => lt.accept(this)),
      semanticId: submodelBase.semanticId?.accept(this),
      supplementalSemanticIds: submodelBase.supplementalSemanticIds.map(s => s.accept(this)),
      qualifiers: submodelBase.qualifiers.map(q => q.accept(this)),
      embeddedDataSpecifications: submodelBase.embeddedDataSpecifications.map(e => e.accept(this)),
    };
  }

  visitProperty(element: Property): any {
    return {
      kindDiscriminator: KeyTypes.Property,
      ...this.buildBase(element),
      extensions: element.extensions.map(e => e.accept(this)),
      valueType: element.valueType,
      value: element.value,
      valueId: element.valueId?.accept(this),
    };
  }

  visitLanguageText(element: LanguageText): any {
    return {
      language: element.language,
      text: element.text,
    };
  }

  visitReference(element: Reference): any {
    return {
      type: element.type,
      referredSemanticId: element.referredSemanticId?.accept(this),
      keys: element.keys.map(key => key.accept(this)),
    };
  }

  visitKey(element: Key): any {
    return {
      type: element.type,
      value: element.value,
    };
  }

  visitQualifier(element: Qualifier): any {
    return {
      type: element.type,
      valueType: element.valueType,
      semanticId: element.semanticId?.accept(this),
      supplementalSemanticIds: element.supplementalSemanticIds.map(s => s.accept(this)),
      kind: element.kind,
      value: element.value,
      valueId: element.valueId?.accept(this),
    };
  }

  visitEmbeddedDataSpecification(element: EmbeddedDataSpecification): any {
    return {
      dataSpecification: element.dataSpecification.accept(this),
      dataSpecificationContent: element.dataSpecificationContent,
    };
  }

  visitExtension(element: Extension): any {
    return {
      name: element.name,
      semanticId: element.semanticId?.accept(this),
      supplementalSemanticIds: element.supplementalSemanticIds.map(s => s.accept(this)),
      valueType: element.valueType,
      value: element.value,
      refersTo: element.refersTo.map(r => r.accept(this)),
    };
  }
}
