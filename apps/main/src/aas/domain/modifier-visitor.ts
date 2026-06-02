import {
  AssetAdministrationShellModificationSchema,
  AssetInformationModificationSchema,
  FileModificationSchema,
  NameAndDescriptionModificationSchema,
  Permissions,
  PropertyModificationSchema,
  ReferenceElementModificationSchema,
  ReferenceModificationSchema,
  SubmodelElementCollectionModificationSchema,
  SubmodelElementListModificationSchema,
  SubmodelElementModificationDto,
} from "@open-dpp/dto";
import { ForbiddenError, NotSupportedError, ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { AdministrativeInformation } from "./common/administrative-information";
import { Key } from "./common/key";
import { hasUniqueLanguagesOrFail, LanguageText } from "./common/language-text";
import { Qualifier } from "./common/qualififiable";
import { Reference } from "./common/reference";
import { ConceptDescription } from "./concept-description";
import { EmbeddedDataSpecification } from "./embedded-data-specification";
import { Extension } from "./extension";
import { Resource } from "./resource";
import { AasAbility } from "./security/aas-ability";
import { AccessPermissionRule } from "./security/access-permission-rule";
import { SubjectAttributes } from "./security/subject-attributes";
import { SpecificAssetId } from "./specific-asset-id";
import { AnnotatedRelationshipElement } from "./submodel-base/annotated-relationship-element";
import { Blob } from "./submodel-base/blob";
import { Entity } from "./submodel-base/entity";
import { File } from "./submodel-base/file";
import { MultiLanguageProperty } from "./submodel-base/multi-language-property";
import { Property } from "./submodel-base/property";
import { Range } from "./submodel-base/range";
import { ReferenceElement } from "./submodel-base/reference-element";

import { RelationshipElement } from "./submodel-base/relationship-element";
import { Submodel } from "./submodel-base/submodel";
import { ISubmodelBase, ISubmodelElement } from "./submodel-base/submodel-base";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";
import { IVisitor } from "./visitor";
import {
  ChangeTracker,
  ITrackable,
  withTrackingHelper,
} from "../../activity-history/domain/change-tracker";
import {
  DescriptionChanged,
  DisplayNameChanged,
} from "../../activity-history/domain/change-events/language-text-collection-changed";
import { IdShortPath } from "./common/id-short-path";
import { PropertyValueChanged } from "../../activity-history/domain/change-events/property-value-changed";
import { FileValueChanged } from "../../activity-history/domain/change-events/file-value-changed";
import { ReferenceElementValueChanged } from "../../activity-history/domain/change-events/reference-element-value-changed";
import { DefaultThumbnailsModified } from "../../activity-history/domain/change-events/default-thumbnails-modified";

export interface ModifierVisitorOptions {
  subject?: SubjectAttributes;
  ability: AasAbility;
}
export interface ModifierVisitorContextType {
  data: unknown;
}
export class ModifierVisitor implements IVisitor<ModifierVisitorContextType, void>, ITrackable {
  tracker = ChangeTracker.create();
  constructor(private readonly options: ModifierVisitorOptions) {}

  withTracking(changeTracker?: ChangeTracker) {
    return withTrackingHelper(changeTracker, this);
  }

  private modifyNameAndDescription<
    T extends {
      displayName: LanguageText[];
      description: LanguageText[];
      getIdShortPath: () => IdShortPath;
    },
  >(generalInfoDto: T, data: unknown): void {
    const { displayName, description } = NameAndDescriptionModificationSchema.parse(data);

    if (displayName) {
      const oldValue = generalInfoDto.displayName;
      generalInfoDto.displayName = displayName.map(LanguageText.fromPlain);
      hasUniqueLanguagesOrFail(generalInfoDto.displayName);
      this.tracker.track(
        DisplayNameChanged.create({
          path: generalInfoDto.getIdShortPath(),
          oldValue: oldValue,
          newValue: generalInfoDto.displayName,
        }),
      );
    }
    if (description) {
      const oldValue = generalInfoDto.description;
      generalInfoDto.description = description.map(LanguageText.fromPlain);
      hasUniqueLanguagesOrFail(generalInfoDto.description);
      this.tracker.track(
        DescriptionChanged.create({
          path: generalInfoDto.getIdShortPath(),
          oldValue,
          newValue: generalInfoDto.description,
        }),
      );
    }
  }

  private modificationGuard(element: ISubmodelBase) {
    const idShortPath = element.getIdShortPath();
    if (!this.options.ability.can(Permissions.Edit, idShortPath)) {
      throw new ForbiddenError(`Missing permissions to modify element ${idShortPath.toString()}.`);
    }
  }

  visitAdministrativeInformation(_element: AdministrativeInformation, _context: unknown): void {
    throw new NotSupportedError("AdministrativeInformation is not supported.");
  }

  visitAnnotatedRelationshipElement(
    _element: AnnotatedRelationshipElement,
    _context: unknown,
  ): void {
    throw new NotSupportedError("AnnotatedRelationshipElement is not supported.");
  }

  visitAssetAdministrationShell(
    element: AssetAdministrationShell,
    context?: ModifierVisitorContextType,
  ): void {
    const parsed = AssetAdministrationShellModificationSchema.parse(context?.data);
    if (parsed.displayName || parsed.description) {
      // this.modificationGuard(element, context); Not yet supported
      this.modifyNameAndDescription(element, parsed);
    }
    if (parsed.assetInformation) {
      element.assetInformation.accept(this, { ...context, data: parsed.assetInformation });
    }
    if (parsed.security && this.options.subject) {
      element.security
        .withAdministrator(this.options.subject)
        .applyModifiedRules(
          parsed.security.localAccessControl.accessPermissionRules.map(
            AccessPermissionRule.fromPlain,
          ),
        );
    }
  }

  visitAssetInformation(element: AssetInformation, context?: ModifierVisitorContextType): void {
    // this.modificationGuard(element, context); // Not yet supported
    const parsed = AssetInformationModificationSchema.parse(context?.data);
    if (parsed.defaultThumbnails) {
      const oldValue = element.defaultThumbnails;
      element.defaultThumbnails = parsed.defaultThumbnails.map(Resource.fromPlain);
      this.tracker.track(
        DefaultThumbnailsModified.create({
          oldValue,
          newValue: element.defaultThumbnails,
        }),
      );
    }
  }

  visitBlob(_element: Blob, _context: unknown): void {
    throw new NotSupportedError("Blob is not supported.");
  }

  visitConceptDescription(_element: ConceptDescription, _context: unknown): void {
    throw new NotSupportedError("ConceptDescription is not supported.");
  }

  visitEmbeddedDataSpecification(_element: EmbeddedDataSpecification, _context: unknown): void {
    throw new NotSupportedError("EmbeddedDataSpecification is not supported.");
  }

  visitEntity(_element: Entity, _context: unknown): void {
    throw new NotSupportedError("Entity is not supported.");
  }

  visitExtension(_element: Extension, _context: unknown): void {
    throw new NotSupportedError("Extension is not supported.");
  }

  visitFile(element: File, context?: ModifierVisitorContextType): void {
    this.modificationGuard(element);
    const parsed = FileModificationSchema.parse(context?.data);
    this.modifyNameAndDescription(element, parsed);

    const oldValue = {
      value: element.value,
      contentType: element.contentType,
    };

    if (parsed.value !== undefined) {
      element.value = parsed.value;
    }
    if (parsed.contentType != null) {
      element.contentType = parsed.contentType;
    }

    this.tracker.track(
      FileValueChanged.create({
        path: element.getIdShortPath(),
        oldValue,
        newValue: {
          value: element.value,
          contentType: element.contentType,
        },
      }),
    );
  }

  visitKey(_element: Key, _context: unknown): void {
    throw new NotSupportedError("Key is not supported.");
  }

  visitLanguageText(_element: LanguageText, _context: unknown): void {
    throw new NotSupportedError("LanguageText is not supported.");
  }

  visitMultiLanguageProperty(_element: MultiLanguageProperty, _context: unknown): void {
    throw new NotSupportedError("MultiLanguageProperty is not supported.");
  }

  visitProperty(element: Property, context?: ModifierVisitorContextType): void {
    this.modificationGuard(element);
    const parsed = PropertyModificationSchema.parse(context?.data);
    this.modifyNameAndDescription(element, parsed);
    if (parsed.value !== undefined) {
      const oldValue = element.value;
      element.value = parsed.value;
      this.tracker.track(
        PropertyValueChanged.create({
          valueType: element.valueType,
          path: element.getIdShortPath(),
          oldValue,
          newValue: parsed.value,
        }),
      );
    }
  }

  visitQualifier(_element: Qualifier, _context: unknown): void {
    throw new NotSupportedError("Qualifier is not supported.");
  }

  visitRange(_element: Range, _context: unknown): void {
    throw new NotSupportedError("Range is not supported.");
  }

  visitReference(element: Reference, context?: ModifierVisitorContextType): void {
    const parsed = ReferenceModificationSchema.parse(context?.data);

    if (parsed.type !== undefined) {
      element.type = parsed.type;
    }
    if (parsed.referredSemanticId === null) {
      element.referredSemanticId = parsed.referredSemanticId;
    } else if (parsed.referredSemanticId !== undefined) {
      if (element.referredSemanticId !== null) {
        element.referredSemanticId.accept(this, { ...context, data: parsed.referredSemanticId });
      } else {
        element.referredSemanticId = Reference.fromPlain(parsed.referredSemanticId);
      }
    }
    if (parsed.keys !== undefined) {
      element.keys = parsed.keys.map(Key.fromPlain);
    }
  }

  visitReferenceElement(element: ReferenceElement, context?: ModifierVisitorContextType): void {
    const parsed = ReferenceElementModificationSchema.parse(context?.data);
    this.modificationGuard(element);
    if (parsed.description || parsed.displayName) {
      this.modifyNameAndDescription(element, parsed);
    }
    const oldValue = element.value ? Reference.fromPlain(element.value.toPlain()) : null;

    if (parsed.value === null) {
      element.value = parsed.value;
    } else if (parsed.value !== undefined) {
      if (element.value !== null) {
        element.value.accept(this, { ...context, data: parsed.value });
      } else {
        element.value = Reference.fromPlain(parsed.value);
      }
    }
    this.tracker.track(
      ReferenceElementValueChanged.create({
        path: element.getIdShortPath(),
        oldValue,
        newValue: element.value,
      }),
    );
  }

  visitRelationshipElement(_element: RelationshipElement, _context: unknown): void {
    throw new NotSupportedError("RelationshipElement is not supported.");
  }

  visitResource(_element: Resource, _context: unknown): void {
    throw new NotSupportedError("Resource is not supported.");
  }

  visitSpecificAssetId(_element: SpecificAssetId, _context: unknown): void {
    throw new NotSupportedError("SpecificAssetId is not supported.");
  }

  visitSubmodel(element: Submodel, context?: ModifierVisitorContextType): void {
    this.modificationGuard(element);
    this.modifyNameAndDescription(element, context?.data);
  }

  visitSubmodelElementCollection(
    element: SubmodelElementCollection,
    context?: ModifierVisitorContextType,
  ): void {
    const parsed = SubmodelElementCollectionModificationSchema.parse(context?.data);
    if (parsed.description || parsed.displayName) {
      this.modificationGuard(element);
      this.modifyNameAndDescription(element, parsed);
    }
    if (parsed.value !== undefined) {
      this.visitSubmodelElements(element, parsed.value);
    }
  }

  visitSubmodelElementList(
    element: SubmodelElementList,
    context?: ModifierVisitorContextType,
  ): void {
    const parsed = SubmodelElementListModificationSchema.parse(context?.data);
    if (parsed.description || parsed.displayName) {
      this.modificationGuard(element);
      this.modifyNameAndDescription(element, parsed);
    }

    if (parsed.value !== undefined) {
      this.visitSubmodelElements(element, parsed.value);
    }
  }

  visitSubmodelElements(
    element: ISubmodelElement,
    submodelElementModifications: SubmodelElementModificationDto[],
  ): void {
    for (const submodelElement of submodelElementModifications) {
      const foundElement = element
        .getSubmodelElements()
        .find((e) => e.idShort === submodelElement.idShort);
      if (!foundElement) {
        throw new ValueError(
          `Could not find element with idShort ${submodelElement.idShort} within submodel element ${element.idShort}.`,
        );
      }
      foundElement.accept(this, { data: submodelElement });
    }
  }
}
