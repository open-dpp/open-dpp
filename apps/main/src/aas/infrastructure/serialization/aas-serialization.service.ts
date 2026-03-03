import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { DataTypeDef, KeyTypes, Language, ModellingKind, QualifierKind, ReferenceTypes } from "@open-dpp/dto";
import { z } from "zod/v4";
import { EnvironmentService } from "../../../aas/presentation/environment.service";
import { Passport } from "../../../passports/domain/passport";
import { Template } from "../../../templates/domain/template";
import { AssetAdministrationShell } from "../../domain/asset-adminstration-shell";
import { AssetInformation } from "../../domain/asset-information";
import { AdministrativeInformation } from "../../domain/common/administrative-information";
import { Key } from "../../domain/common/key";
import { LanguageText } from "../../domain/common/language-text";
import { Qualifier } from "../../domain/common/qualififiable";
import { Reference } from "../../domain/common/reference";
import { ConceptDescription } from "../../domain/concept-description";
import { EmbeddedDataSpecification } from "../../domain/embedded-data-specification";
import { Environment } from "../../domain/environment";
import { AasExportable } from "../../domain/exportable/aas-exportable";
import { Extension } from "../../domain/extension";
import { Resource } from "../../domain/resource";
import { SpecificAssetId } from "../../domain/specific-asset-id";
import { Submodel } from "../../domain/submodel-base/submodel";
import { parseSubmodelElement } from "../../domain/submodel-base/submodel-base";
import { AasRepository } from "../aas.repository";
import { ConceptDescriptionRepository } from "../concept-description.repository";
import { SubmodelRepository } from "../submodel.repository";

const AasExportFormat = {
  "open-dpp:json": "open-dpp:json",
} as const;
const AasExportVersion = {
  "1.0": "1.0",
} as const;

// versioned zod schemas
export const DataTypeDefV1_0 = {
  AnyUri: "AnyUri",
  Base64Binary: "Base64Binary",
  Boolean: "Boolean",
  Byte: "Byte",
  Date: "Date",
  DateTime: "DateTime",
  Decimal: "Decimal",
  Double: "Double",
  Duration: "Duration",
  Float: "Float",
  GDay: "GDay",
  GMonth: "GMonth",
  GMonthDay: "GMonthDay",
  GYear: "GYear",
  GYearMonth: "GYearMonth",
  HexBinary: "HexBinary",
  Int: "Int",
  Integer: "Integer",
  Long: "Long",
  NegativeInteger: "NegativeInteger",
  NonNegativeInteger: "NonNegativeInteger",
  NonPositiveInteger: "NonPositiveInteger",
  PositiveInteger: "PositiveInteger",
  Short: "Short",
  String: "String",
  Time: "Time",
  UnsignedByte: "UnsignedByte",
  UnsignedInt: "UnsignedInt",
  UnsignedLong: "UnsignedLong",
  UnsignedShort: "UnsignedShort",
} as const;
export const KeyTypesV1_0 = {
  AnnotatedRelationshipElement: "AnnotatedRelationshipElement",
  AssetAdministrationShell: "AssetAdministrationShell",
  BasicEventElement: "BasicEventElement",
  Blob: "Blob",
  Capability: "Capability",
  ConceptDescription: "ConceptDescription",
  DataElement: "DataElement",
  Entity: "Entity",
  EventElement: "EventElement",
  File: "File",
  FragmentReference: "FragmentReference",
  GlobalReference: "GlobalReference",
  Identifiable: "Identifiable",
  MultiLanguageProperty: "MultiLanguageProperty",
  Operation: "Operation",
  Property: "Property",
  Range: "Range",
  Referable: "Referable",
  ReferenceElement: "ReferenceElement",
  RelationshipElement: "RelationshipElement",
  Submodel: "Submodel",
  SubmodelElement: "SubmodelElement",
  SubmodelElementCollection: "SubmodelElementCollection",
  SubmodelElementList: "SubmodelElementList",
} as const;
export const LanguageTypeSchemaV1_0 = {
  en: "en",
  de: "de",
} as const;
const ReferenceSchemaV1_0 = z.object({
  type: z.enum(["ExternalReference", "ModelReference"]),
  referredSemanticId: z.object().nullable().optional(), // this should be reference too
  keys: z.array(z.object({
    type: z.enum(KeyTypesV1_0),
    value: z.string(),
  })),
});
const LanguageTextSchemaV1_0 = z.object({
  language: z.enum(LanguageTypeSchemaV1_0),
  _text: z.string().optional(),
});
const aasExportSchemaJsonV1_0 = z.object({
  id: z.string(),
  environment: z.object({
    assetAdministrationShells: z.array(z.object({
      assetInformation: z.object({
        assetKind: z.enum(["Type", "Instance"]),
        globalAssetId: z.string().nullable().optional(),
        specificAssetIds: z.array(z.object({
          name: z.string(),
          value: z.string(),
          semanticId: ReferenceSchemaV1_0.nullable(),
          supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
          externalSubjectId: ReferenceSchemaV1_0.nullable(),
        })),
        assetType: z.string().nullable(),
        defaultThumbnail: z.object({
          path: z.string(),
          contentType: z.string().nullable(),
        }).nullable().optional(),
      }),
      extensions: z.array(z.object({
        name: z.string(),
        semanticId: ReferenceSchemaV1_0.nullable(),
        supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
        valueType: z.enum(DataTypeDefV1_0).nullable(),
        value: z.string().nullable(),
        refersTo: z.array(ReferenceSchemaV1_0),
      })),
      category: z.string().nullable(),
      idShort: z.string().nullable(),
      displayName: z.array(LanguageTextSchemaV1_0),
      description: z.array(LanguageTextSchemaV1_0),
      administration: z.object({
        version: z.string(),
        revision: z.string(),
      }).nullable(),
      embeddedDataSpecifications: z.array(z.object({
        dataSpecification: ReferenceSchemaV1_0,
      })),
      derivedFrom: ReferenceSchemaV1_0.nullable().optional(),
      submodels: z.array(ReferenceSchemaV1_0),
    })),
    submodels: z.array(z.object({
      id: z.string(),
      extensions: z.array(z.object({
        name: z.string(),
        semanticId: ReferenceSchemaV1_0.nullable(),
        supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
        valueType: z.enum(DataTypeDefV1_0).nullable(),
        value: z.string().nullable(),
        refersTo: z.array(ReferenceSchemaV1_0),
      })),
      category: z.string().nullable(),
      idShort: z.string(),
      displayName: z.array(LanguageTextSchemaV1_0),
      description: z.array(LanguageTextSchemaV1_0),
      administration: z.object({
        version: z.string(),
        revision: z.string(),
      }).nullable().optional(),
      kind: z.enum(["Template", "Instance"]).nullable(),
      semanticId: ReferenceSchemaV1_0.nullable().optional(),
      supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
      qualifiers: z.array(z.object({
        type: z.string(),
        valueType: z.enum(DataTypeDefV1_0).nullable(),
        semanticId: ReferenceSchemaV1_0.nullable(),
        supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
        kind: z.enum(["ValueQualifier", "ConceptQualifier", "TemplateQualifier"]).nullable(),
        value: z.string().nullable(),
        valueId: ReferenceSchemaV1_0.nullable(),
      })),
      embeddedDataSpecifications: z.array(z.object({
        dataSpecification: ReferenceSchemaV1_0,
      })),
      submodelElements: z.array(z.object({
        category: z.string().nullable(),
        idShort: z.string().nullable(),
        displayName: z.array(LanguageTextSchemaV1_0),
        description: z.array(LanguageTextSchemaV1_0),
        semanticId: ReferenceSchemaV1_0.nullable().optional(),
        supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
        qualifiers: z.array(z.object({
          type: z.string(),
          valueType: z.enum(DataTypeDefV1_0).nullable(),
          semanticId: ReferenceSchemaV1_0.nullable(),
          supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
          kind: z.enum(["ValueQualifier", "ConceptQualifier", "TemplateQualifier"]).nullable(),
          value: z.string().nullable(),
          valueId: ReferenceSchemaV1_0.nullable(),
        })),
        embeddedDataSpecifications: z.array(z.object({
          dataSpecification: ReferenceSchemaV1_0,
        })),
      })),
    })),
    conceptDescriptions: z.array(z.object({
      extensions: z.array(z.object({
        name: z.string(),
        semanticId: ReferenceSchemaV1_0.nullable(),
        supplementalSemanticIds: z.array(ReferenceSchemaV1_0),
        valueType: z.enum(DataTypeDefV1_0).nullable(),
        value: z.string().nullable(),
        refersTo: z.array(ReferenceSchemaV1_0),
      })),
      category: z.string().nullable(),
      idShort: z.string().nullable(),
      displayName: z.array(LanguageTextSchemaV1_0),
      description: z.array(LanguageTextSchemaV1_0),
      semanticId: ReferenceSchemaV1_0.nullable(),
      administration: z.object({
        version: z.string(),
        revision: z.string(),
      }).nullable(),
      embeddedDataSpecifications: z.array(z.object({
        dataSpecification: ReferenceSchemaV1_0,
      })),
      isCaseOf: z.array(ReferenceSchemaV1_0),
    })),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  format: z.literal(AasExportFormat["open-dpp:json"].toString()),
  version: z.literal(AasExportVersion["1.0"].toString()),
});

type AasExportSchema = z.infer<typeof aasExportSchemaJsonV1_0>;

@Injectable()
export class AasSerializationService {
  private readonly logger = new Logger(AasSerializationService.name);

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly aasRepository: AasRepository,
    private readonly submodelRepository: SubmodelRepository,
    private readonly conceptDescriptionRepository: ConceptDescriptionRepository,
  ) {}

  async exportPassport(passport: Passport): Promise<AasExportSchema> {
    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(passport.environment);
    const aaxExportable = AasExportable.createFromPassport(passport, expandedEnvironment);
    return aasExportSchemaJsonV1_0.parse(aaxExportable.toExportPlain());
  }

  async exportTemplate(template: Template): Promise<AasExportSchema> {
    const expandedEnvironment = await this.environmentService.loadExpandedEnvironment(template.environment);
    const aasExportable = AasExportable.createFromTemplate(template, expandedEnvironment);
    return aasExportSchemaJsonV1_0.parse(aasExportable.toExportPlain());
  }

  async importPassport(data: any, organizationId: string): Promise<Passport | null> {
    try {
      // parse full schema
      const aasExportableSchema = aasExportSchemaJsonV1_0.parse(data);

      // prepare environment domain
      // mapping assetAdministrationShells to current domain
      const assetAdministrationShells: AssetAdministrationShell[] = [];
      for (const shell of aasExportableSchema.environment.assetAdministrationShells) {
        const assetInformation = AssetInformation.create({
          assetKind: shell.assetInformation.assetKind,
          globalAssetId: shell.assetInformation.globalAssetId,
          specificAssetIds: shell.assetInformation.specificAssetIds
            .map(specificAssetId => SpecificAssetId.create({
              name: specificAssetId.name,
              value: specificAssetId.value,
              semanticId: specificAssetId.semanticId
                ? Reference.create({
                    type: ReferenceTypes[specificAssetId.semanticId.type],
                    referredSemanticId: Reference.fromPlain(specificAssetId.semanticId.referredSemanticId),
                    keys: specificAssetId.semanticId.keys.map(key => Key.create({
                      type: KeyTypes[key.type],
                      value: key.value,
                    })),
                  })
                : null,
            })),
          assetType: shell.assetInformation.assetType,
          defaultThumbnail: shell.assetInformation.defaultThumbnail
            ? Resource.create({
                path: shell.assetInformation.defaultThumbnail.path,
                contentType: shell.assetInformation.defaultThumbnail.contentType,
              })
            : null,
        });
        const aas = AssetAdministrationShell.create({
          assetInformation,
          extensions: shell.extensions.map(extension => Extension.create({
            name: extension.name,
            semanticId: extension.semanticId
              ? Reference.create({
                  type: ReferenceTypes[extension.semanticId.type],
                  referredSemanticId: Reference.fromPlain(extension.semanticId.referredSemanticId),
                  keys: extension.semanticId.keys.map(key => Key.create({
                    type: KeyTypes[key.type],
                    value: key.value,
                  })),
                })
              : null,
            supplementalSemanticIds: extension.supplementalSemanticIds.map(supplementalSemanticId => Reference.create({
              type: ReferenceTypes[supplementalSemanticId.type],
              referredSemanticId: Reference.fromPlain(supplementalSemanticId.referredSemanticId),
              keys: supplementalSemanticId.keys.map(key => Key.create({
                type: KeyTypes[key.type],
                value: key.value,
              })),
            })),
            valueType: extension.valueType ? DataTypeDef[extension.valueType] : null,
            value: extension.value,
            refersTo: extension.refersTo.map(ref => Reference.create({
              type: ReferenceTypes[ref.type],
              referredSemanticId: Reference.fromPlain(ref.referredSemanticId),
              keys: ref.keys.map(key => Key.create({
                type: KeyTypes[key.type],
                value: key.value,
              })),
            })),
          })),
          category: shell.category,
          idShort: shell.idShort,
          displayName: shell.displayName
            ? shell.displayName.filter(displayName => displayName._text).map(displayName => LanguageText.create({
                language: Language[displayName.language],
                text: displayName._text ?? "",
              }))
            : [],
          description: shell.description
            ? shell.description.filter(displayName => displayName._text).map(description => LanguageText.create({
                language: Language[description.language],
                text: description._text ?? "",
              }))
            : [],
          administration: shell.administration
            ? AdministrativeInformation.create({
                version: shell.administration.version,
                revision: shell.administration.revision,
              })
            : undefined,
          embeddedDataSpecifications: shell.embeddedDataSpecifications
            ? shell.embeddedDataSpecifications.map(embeddedDataSpecification => EmbeddedDataSpecification.create({
                dataSpecification: Reference.create({
                  type: ReferenceTypes[embeddedDataSpecification.dataSpecification.type],
                  referredSemanticId: Reference.fromPlain(embeddedDataSpecification.dataSpecification.referredSemanticId),
                  keys: embeddedDataSpecification.dataSpecification.keys.map(key => Key.create({
                    type: KeyTypes[key.type],
                    value: key.value,
                  })),
                }),
              }))
            : [],
          derivedFrom: shell.derivedFrom
            ? Reference.create({
                type: ReferenceTypes[shell.derivedFrom.type],
                referredSemanticId: Reference.fromPlain(shell.derivedFrom.referredSemanticId),
                keys: shell.derivedFrom.keys.map(key => Key.create({
                  type: KeyTypes[key.type],
                  value: key.value,
                })),
              })
            : null,
          submodels: shell.submodels.map(submodel => Reference.create({
            type: ReferenceTypes[submodel.type],
            referredSemanticId: Reference.fromPlain(submodel.referredSemanticId),
            keys: submodel.keys.map(key => Key.create({
              type: KeyTypes[key.type],
              value: key.value,
            })),
          })),
        });
        assetAdministrationShells.push(aas);
      }
      // mapping submodels to current domain
      const submodels: Array<Submodel> = [];
      for (const submodel of aasExportableSchema.environment.submodels) {
        const sub = Submodel.create({
          id: submodel.id,
          extensions: submodel.extensions.map(extension => Extension.create({
            name: extension.name,
            semanticId: extension.semanticId
              ? Reference.create({
                  type: ReferenceTypes[extension.semanticId.type],
                  referredSemanticId: Reference.fromPlain(extension.semanticId.referredSemanticId),
                  keys: extension.semanticId.keys.map(key => Key.create({
                    type: KeyTypes[key.type],
                    value: key.value,
                  })),
                })
              : null,
            supplementalSemanticIds: extension.supplementalSemanticIds.map(ref => Reference.create({
              type: ReferenceTypes[ref.type],
              referredSemanticId: Reference.fromPlain(ref.referredSemanticId),
              keys: ref.keys.map(key => Key.create({
                type: KeyTypes[key.type],
                value: key.value,
              })),
            })),
            valueType: extension.valueType ? DataTypeDef[extension.valueType] : null,
            value: extension.value,
            refersTo: extension.refersTo.map(ref => Reference.create({
              type: ReferenceTypes[ref.type],
              referredSemanticId: Reference.fromPlain(ref.referredSemanticId),
              keys: ref.keys.map(key => Key.create({
                type: KeyTypes[key.type],
                value: key.value,
              })),
            })),
          })),
          category: submodel.category,
          idShort: submodel.idShort,
          displayName: submodel.displayName
            .filter(langText => langText._text)
            .map(langText => LanguageText.create({
              language: Language[langText.language],
              text: langText._text ?? "",
            })),
          description: submodel.description
            .filter(langText => langText._text)
            .map(langText => LanguageText.create({
              language: Language[langText.language],
              text: langText._text ?? "",
            })),
          administration: submodel.administration
            ? AdministrativeInformation.create({
                version: submodel.administration.version,
                revision: submodel.administration.revision,
              })
            : null,
          kind: submodel.kind ? ModellingKind[submodel.kind] : null,
          semanticId: submodel.semanticId
            ? Reference.create({
                type: ReferenceTypes[submodel.semanticId.type],
                referredSemanticId: Reference.fromPlain(submodel.semanticId.referredSemanticId),
                keys: submodel.semanticId.keys.map(key => Key.create({
                  type: KeyTypes[key.type],
                  value: key.value,
                })),
              })
            : null,
          supplementalSemanticIds: submodel.supplementalSemanticIds.map(ref => Reference.create({
            type: ReferenceTypes[ref.type],
            referredSemanticId: Reference.fromPlain(ref.referredSemanticId),
            keys: ref.keys.map(key => Key.create({
              type: KeyTypes[key.type],
              value: key.value,
            })),
          })),
          qualifiers: submodel.qualifiers
            .filter(qualifier => qualifier.valueType != null && qualifier.kind != null)
            .map(qualifier => Qualifier.create({
              type: qualifier.type,
              valueType: DataTypeDef[qualifier.valueType!],
              semanticId: qualifier.semanticId
                ? Reference.create({
                    type: ReferenceTypes[qualifier.semanticId.type],
                    referredSemanticId: Reference.fromPlain(qualifier.semanticId.referredSemanticId),
                    keys: qualifier.semanticId.keys.map(key => Key.create({
                      type: KeyTypes[key.type],
                      value: key.value,
                    })),
                  })
                : null,
              supplementalSemanticIds: qualifier.supplementalSemanticIds.map(ref => Reference.create({
                type: ReferenceTypes[ref.type],
                referredSemanticId: Reference.fromPlain(ref.referredSemanticId),
                keys: ref.keys.map(key => Key.create({
                  type: KeyTypes[key.type],
                  value: key.value,
                })),
              })),
              kind: QualifierKind[qualifier.kind!],
              value: qualifier.value,
              valueId: qualifier.valueId
                ? Reference.create({
                    type: ReferenceTypes[qualifier.valueId.type],
                    referredSemanticId: Reference.fromPlain(qualifier.valueId.referredSemanticId),
                    keys: qualifier.valueId.keys.map(key => Key.create({
                      type: KeyTypes[key.type],
                      value: key.value,
                    })),
                  })
                : null,
            })),
          embeddedDataSpecifications: submodel.embeddedDataSpecifications.map(eds => EmbeddedDataSpecification.create({
            dataSpecification: Reference.create({
              type: ReferenceTypes[eds.dataSpecification.type],
              referredSemanticId: Reference.fromPlain(eds.dataSpecification.referredSemanticId),
              keys: eds.dataSpecification.keys.map(key => Key.create({
                type: KeyTypes[key.type],
                value: key.value,
              })),
            }),
          })),
          submodelElements: submodel.submodelElements.map(element => parseSubmodelElement(element)),
        });
        submodels.push(sub);
      }
      // mapping conceptDescriptions to current domain
      const conceptDescriptions: Array<ConceptDescription> = [];
      for (const conceptDescription of aasExportableSchema.environment.conceptDescriptions) {
        const conceptDesc = ConceptDescription.create({
          id: "",
          extensions: conceptDescription.extensions.map(extension => Extension.create({
            name: extension.name,
            semanticId: extension.semanticId
              ? Reference.create({
                  type: ReferenceTypes[extension.semanticId.type],
                  referredSemanticId: Reference.fromPlain(extension.semanticId.referredSemanticId),
                  keys: extension.semanticId.keys.map(key => Key.create({
                    type: KeyTypes[key.type],
                    value: key.value,
                  })),
                })
              : null,
            supplementalSemanticIds: extension.supplementalSemanticIds.map(ref => Reference.create({
              type: ReferenceTypes[ref.type],
              referredSemanticId: Reference.fromPlain(ref.referredSemanticId),
              keys: ref.keys.map(key => Key.create({
                type: KeyTypes[key.type],
                value: key.value,
              })),
            })),
            valueType: extension.valueType ? DataTypeDef[extension.valueType] : null,
            value: extension.value,
            refersTo: extension.refersTo.map(ref => Reference.create({
              type: ReferenceTypes[ref.type],
              referredSemanticId: Reference.fromPlain(ref.referredSemanticId),
              keys: ref.keys.map(key => Key.create({
                type: KeyTypes[key.type],
                value: key.value,
              })),
            })),
          })),
          category: conceptDescription.category,
          idShort: conceptDescription.idShort,
          displayName: conceptDescription.displayName
            .filter(langText => langText._text)
            .map(langText => LanguageText.create({
              language: Language[langText.language],
              text: langText._text ?? "",
            })),
          description: conceptDescription.description
            .filter(langText => langText._text)
            .map(langText => LanguageText.create({
              language: Language[langText.language],
              text: langText._text ?? "",
            })),
          semanticId: conceptDescription.semanticId
            ? Reference.create({
                type: ReferenceTypes[conceptDescription.semanticId.type],
                referredSemanticId: Reference.fromPlain(conceptDescription.semanticId.referredSemanticId),
                keys: conceptDescription.semanticId.keys.map(key => Key.create({
                  type: KeyTypes[key.type],
                  value: key.value,
                })),
              })
            : null,
          administration: conceptDescription.administration
            ? AdministrativeInformation.create({
                version: conceptDescription.administration.version,
                revision: conceptDescription.administration.revision,
              })
            : undefined,
          embeddedDataSpecifications: conceptDescription.embeddedDataSpecifications.map(eds => EmbeddedDataSpecification.create({
            dataSpecification: Reference.create({
              type: ReferenceTypes[eds.dataSpecification.type],
              referredSemanticId: Reference.fromPlain(eds.dataSpecification.referredSemanticId),
              keys: eds.dataSpecification.keys.map(key => Key.create({
                type: KeyTypes[key.type],
                value: key.value,
              })),
            }),
          })),
          isCaseOf: conceptDescription.isCaseOf.map(ref => Reference.create({
            type: ReferenceTypes[ref.type],
            referredSemanticId: Reference.fromPlain(ref.referredSemanticId),
            keys: ref.keys.map(key => Key.create({
              type: KeyTypes[key.type],
              value: key.value,
            })),
          })),
        });
        conceptDescriptions.push(conceptDesc);
      }
      // save all aas
      const newShellPromises: Array<Promise<AssetAdministrationShell>> = [];
      for (const shell of assetAdministrationShells) {
        newShellPromises.push(this.aasRepository.save(shell));
      }
      const newShells = await Promise.all(newShellPromises);
      // save all submodels
      const newSubmodelsPromises: Array<Promise<Submodel>> = [];
      for (const submodel of submodels) {
        newSubmodelsPromises.push(this.submodelRepository.save(submodel));
      }
      const newSubmodels = await Promise.all(newSubmodelsPromises);
      // save all conceptDescriptions
      const newConceptDescriptionsPromises: Array<Promise<ConceptDescription>> = [];
      for (const conceptDescription of conceptDescriptions) {
        newConceptDescriptionsPromises.push(this.conceptDescriptionRepository.save(conceptDescription));
      }
      const newConceptDescriptions = await Promise.all(newConceptDescriptionsPromises);
      // create environment
      const environment = Environment.create({
        assetAdministrationShells: newShells.map(aas => aas.id),
        submodels: newSubmodels.map(submodel => submodel.id).slice(0, 0),
        conceptDescriptions: newConceptDescriptions.map(conceptDescription => conceptDescription.id).slice(0, 0),
      });
      // save environment
      // create passport
      const passport = Passport.create({
        organizationId,
        environment,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // save passport

      // const upid = passport.createUniqueProductIdentifier();

      // Persist all entities in a single transaction to avoid partial commits
      /* const session = await this.connection.startSession();
      try {
        await session.withTransaction(async () => {
          for (const submodel of Array.from(oldIdToNewSubmodelMap.values())) {
            await this.submodelRepository.save(submodel, { session });
          }
          for (const shell of newShells) {
            await this.aasRepository.save(shell, { session });
          }
          await this.passportRepository.save(newPassport, { session });
          await this.uniqueProductIdentifierService.save(upid);
        });
      }
      catch (e) {
        // TODO
      } */
      return passport;
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException();
      }
    }
    return null;
  }

  async importTemplate(data: any, organizationId: string): Promise<Template | null> {
    try {
      const aasExportableSchema = aasExportSchemaJsonV1_0.parse(data);
      const environment = Environment.fromPlain(aasExportableSchema.environment);
      const template = Template.create({
        organizationId,
        environment,
        createdAt: aasExportableSchema.createdAt,
        updatedAt: aasExportableSchema.updatedAt,
      });
      /* await this.environmentService.persistImportedEnvironment(
        shells,
        submodels,
        async (options) => { await this.templateRepository.save(entity, options); },
      ); */

      return template;
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        throw new BadRequestException();
      }
    }
    return null;
  }
}
