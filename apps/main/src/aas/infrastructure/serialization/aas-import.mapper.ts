import type { AasExportSchema } from "./aas-export-v1.schema";
import { randomUUID } from "node:crypto";
import { DataTypeDef, KeyTypes, Language, ModellingKind, QualifierKind, ReferenceTypes } from "@open-dpp/dto";
import { z } from "zod/v4";
import { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { AssetInformation } from "../../domain/asset-information";
import { AdministrativeInformation } from "../../domain/common/administrative-information";
import { Key } from "../../domain/common/key";
import { LanguageText } from "../../domain/common/language-text";
import { Qualifier } from "../../domain/common/qualififiable";
import { Reference } from "../../domain/common/reference";
import { ConceptDescription } from "../../domain/concept-description";
import { EmbeddedDataSpecification } from "../../domain/embedded-data-specification";
import { Extension } from "../../domain/extension";
import { Resource } from "../../domain/resource";
import { SpecificAssetId } from "../../domain/specific-asset-id";
import { Submodel } from "../../domain/submodel-base/submodel";
import { parseSubmodelElement } from "../../domain/submodel-base/submodel-base";
import { ReferenceSchemaV1_0 } from "./aas-export-v1.schema";

type ReferenceSchema = z.infer<typeof ReferenceSchemaV1_0>;
type ShellSchema = AasExportSchema["environment"]["assetAdministrationShells"][number];
type SubmodelSchema = AasExportSchema["environment"]["submodels"][number];
type ConceptDescriptionSchema = AasExportSchema["environment"]["conceptDescriptions"][number];
type ExtensionSchema = ShellSchema["extensions"][number];
type QualifierSchema = SubmodelSchema["qualifiers"][number];

export function mapReference(ref: ReferenceSchema): Reference {
  return Reference.create({
    type: ReferenceTypes[ref.type],
    referredSemanticId: ref.referredSemanticId ? Reference.fromPlain(ref.referredSemanticId) : undefined,
    keys: ref.keys.map(key => Key.create({
      type: KeyTypes[key.type],
      value: key.value,
    })),
  });
}

export function mapNullableReference(ref: ReferenceSchema | null | undefined): Reference | null {
  return ref ? mapReference(ref) : null;
}

export function mapReferences(refs: ReferenceSchema[]): Reference[] {
  return refs.map(mapReference);
}

export function mapLanguageTexts(texts: Array<{ language: string; _text?: string }>): LanguageText[] {
  return texts
    .filter(t => t._text && t.language in Language)
    .map(t => LanguageText.create({
      language: Language[t.language as keyof typeof Language],
      text: t._text ?? "",
    }));
}

export function mapAdministration(
  admin: { version: string; revision: string } | null | undefined,
): AdministrativeInformation | null | undefined {
  if (admin == null)
    return admin;
  return AdministrativeInformation.create({
    version: admin.version,
    revision: admin.revision,
  });
}

export function mapExtension(ext: ExtensionSchema): Extension {
  return Extension.create({
    name: ext.name,
    semanticId: mapNullableReference(ext.semanticId),
    supplementalSemanticIds: mapReferences(ext.supplementalSemanticIds),
    valueType: ext.valueType ? DataTypeDef[ext.valueType] : null,
    value: ext.value,
    refersTo: mapReferences(ext.refersTo),
  });
}

export function mapExtensions(exts: ExtensionSchema[]): Extension[] {
  return exts.map(mapExtension);
}

export function mapEmbeddedDataSpecifications(
  specs: Array<{ dataSpecification: ReferenceSchema }>,
): EmbeddedDataSpecification[] {
  return specs.map(s => EmbeddedDataSpecification.create({
    dataSpecification: mapReference(s.dataSpecification),
  }));
}

export function mapQualifier(q: QualifierSchema): Qualifier {
  return Qualifier.create({
    type: q.type,
    valueType: DataTypeDef[q.valueType!],
    semanticId: mapNullableReference(q.semanticId),
    supplementalSemanticIds: mapReferences(q.supplementalSemanticIds),
    kind: QualifierKind[q.kind!],
    value: q.value,
    valueId: mapNullableReference(q.valueId),
  });
}

export function mapQualifiers(qualifiers: QualifierSchema[]): Qualifier[] {
  return qualifiers
    .filter(q => q.valueType != null && q.kind != null)
    .map(mapQualifier);
}

export function mapAssetAdministrationShells(shells: ShellSchema[]): AssetAdministrationShell[] {
  return shells.map((shell) => {
    const assetInformation = AssetInformation.create({
      assetKind: shell.assetInformation.assetKind,
      globalAssetId: shell.assetInformation.globalAssetId,
      specificAssetIds: shell.assetInformation.specificAssetIds.map(sa =>
        SpecificAssetId.create({
          name: sa.name,
          value: sa.value,
          semanticId: mapNullableReference(sa.semanticId),
        }),
      ),
      assetType: shell.assetInformation.assetType,
      defaultThumbnails: shell.assetInformation.defaultThumbnail
        ? [Resource.create({
            path: shell.assetInformation.defaultThumbnail.path,
            contentType: shell.assetInformation.defaultThumbnail.contentType,
          })]
        : [],
    });

    return AssetAdministrationShell.create({
      assetInformation,
      extensions: mapExtensions(shell.extensions),
      category: shell.category,
      idShort: shell.idShort,
      displayName: mapLanguageTexts(shell.displayName),
      description: mapLanguageTexts(shell.description),
      administration: mapAdministration(shell.administration) ?? undefined,
      embeddedDataSpecifications: mapEmbeddedDataSpecifications(shell.embeddedDataSpecifications),
      derivedFrom: mapNullableReference(shell.derivedFrom),
      submodels: mapReferences(shell.submodels),
    });
  });
}

export function mapSubmodels(submodels: SubmodelSchema[]): Submodel[] {
  return submodels.map(submodel =>
    Submodel.create({
      id: submodel.id,
      extensions: mapExtensions(submodel.extensions),
      category: submodel.category,
      idShort: submodel.idShort,
      displayName: mapLanguageTexts(submodel.displayName),
      description: mapLanguageTexts(submodel.description),
      administration: submodel.administration
        ? AdministrativeInformation.create({
            version: submodel.administration.version,
            revision: submodel.administration.revision,
          })
        : null,
      kind: submodel.kind ? ModellingKind[submodel.kind] : null,
      semanticId: mapNullableReference(submodel.semanticId),
      supplementalSemanticIds: mapReferences(submodel.supplementalSemanticIds),
      qualifiers: mapQualifiers(submodel.qualifiers),
      embeddedDataSpecifications: mapEmbeddedDataSpecifications(submodel.embeddedDataSpecifications),
      submodelElements: submodel.submodelElements.map(element => parseSubmodelElement(element)),
    }),
  );
}

export function mapConceptDescriptions(cds: ConceptDescriptionSchema[]): ConceptDescription[] {
  return cds.map(cd =>
    ConceptDescription.create({
      id: randomUUID(),
      extensions: mapExtensions(cd.extensions),
      category: cd.category,
      idShort: cd.idShort,
      displayName: mapLanguageTexts(cd.displayName),
      description: mapLanguageTexts(cd.description),
      semanticId: mapNullableReference(cd.semanticId),
      administration: mapAdministration(cd.administration) ?? undefined,
      embeddedDataSpecifications: mapEmbeddedDataSpecifications(cd.embeddedDataSpecifications),
      isCaseOf: mapReferences(cd.isCaseOf),
    }),
  );
}
