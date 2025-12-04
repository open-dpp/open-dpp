import type { GranularityLevel_TYPE } from "../../data-modelling/domain/granularity-level";
import type { DataFieldValidationResult } from "./data-field";
import type { Section, SectionDbProps } from "./section";
import { randomUUID } from "node:crypto";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { AssetInformation } from "../../aas/domain/asset-information";
import { AssetKind } from "../../aas/domain/asset-kind-enum";
import { AdministrativeInformation } from "../../aas/domain/common/administrative-information";
import { Key } from "../../aas/domain/common/key";
import { KeyTypes } from "../../aas/domain/common/key-types-enum";
import { Language } from "../../aas/domain/common/language-enum";
import { LanguageText } from "../../aas/domain/common/language-text";
import { Reference, ReferenceTypes } from "../../aas/domain/common/reference";
import { Environment } from "../../aas/domain/environment";
import { AasSubmodelElements } from "../../aas/domain/submodel-base/aas-submodel-elements";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { SubmodelElementCollection } from "../../aas/domain/submodel-base/submodel-element-collection";
import { SubmodelElementList } from "../../aas/domain/submodel-base/submodel-element-list";
import { SectionType } from "../../data-modelling/domain/section-base";
import { Sector_TYPE } from "../../data-modelling/domain/sectors";
import { DataValue } from "../../product-passport-data/domain/data-value";
import { findSectionClassByTypeOrFail } from "./section";

export class ValidationResult {
  private readonly _validationResults: DataFieldValidationResult[] = [];
  private _isValid: boolean = true;

  public get isValid() {
    return this._isValid;
  }

  public get validationResults() {
    return this._validationResults;
  }

  public addValidationResult(validationResult: DataFieldValidationResult) {
    if (!validationResult.isValid) {
      this._isValid = false;
    }
    this._validationResults.push(validationResult);
  }

  public toJson() {
    return {
      isValid: this.isValid,
      errors: this.validationResults
        .filter(v => !v.isValid)
        .map(v => v.toJson()),
    };
  }
}

export interface TemplateCreateProps {
  name: string;
  description: string;
  sectors: Sector_TYPE[];
  userId: string;
  organizationId: string;
}

export type TemplateDbProps = TemplateCreateProps & {
  id: string;
  version: string;
  sections: SectionDbProps[];
  marketplaceResourceId: string | null;
};

export class Template {
  public readonly id: string;
  public readonly name: string;
  public description: string;
  public sectors: Sector_TYPE[];
  public readonly version: string;
  private _createdByUserId: string;
  private _ownedByOrganizationId: string;
  public readonly sections: Section[];
  public marketplaceResourceId: string | null;

  private constructor(
    id: string,
    name: string,
    description: string,
    sectors: Sector_TYPE[],
    version: string,
    _createdByUserId: string,
    _ownedByOrganizationId: string,
    sections: Section[],
    marketplaceResourceId: string | null,
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.sectors = sectors;
    this.version = version;
    this._createdByUserId = _createdByUserId;
    this._ownedByOrganizationId = _ownedByOrganizationId;
    this.sections = sections;
    this.marketplaceResourceId = marketplaceResourceId;
  }

  static create(plain: {
    name: string;
    description: string;
    sectors: Sector_TYPE[];
    userId: string;
    organizationId: string;
  }) {
    return new Template(
      randomUUID(),
      plain.name,
      plain.description,
      plain.sectors,
      "1.0.0",
      plain.userId,
      plain.organizationId,
      [],
      null,
    );
  }

  static loadFromDb(data: TemplateDbProps) {
    return new Template(
      data.id,
      data.name,
      data.description,
      data.sectors,
      data.version,
      data.userId,
      data.organizationId,
      data.sections.map((s) => {
        const SectionClass = findSectionClassByTypeOrFail(s.type);
        return SectionClass.loadFromDb(s);
      }),
      data.marketplaceResourceId,
    );
  }

  public isOwnedBy(organizationId: string) {
    return this.ownedByOrganizationId === organizationId;
  }

  public get createdByUserId() {
    return this._createdByUserId;
  }

  public get ownedByOrganizationId() {
    return this._ownedByOrganizationId;
  }

  findSectionByIdOrFail(id: string): Section {
    const section = this.findSectionById(id);
    if (!section) {
      throw new Error(`Section with id ${id} not found`);
    }
    return section;
  }

  findSectionById(id: string): Section | undefined {
    return this.sections.find(s => s.id === id);
  }

  assignMarketplaceResource(marketplaceResourceId: string) {
    this.marketplaceResourceId = marketplaceResourceId;
  }

  validate(
    values: DataValue[],
    granularity: GranularityLevel_TYPE,
    includeSectionIds: string[] = [],
  ): ValidationResult {
    const validationOutput = new ValidationResult();
    const sectionsToValidate
      = includeSectionIds.length === 0
        ? this.sections
        : this.sections.filter(s => includeSectionIds.includes(s.id));
    for (const section of sectionsToValidate) {
      section
        .validate(this.version, values, granularity)
        .map(v => validationOutput.addValidationResult(v));
    }
    return validationOutput;
  }

  copy(organizationId: string, userId: string) {
    return Template.loadFromDb({
      id: randomUUID(),
      name: this.name,
      description: this.description,
      sectors: this.sectors,
      version: this.version,
      userId,
      organizationId,
      sections: this.sections.map(s => s.toDbProps()),
      marketplaceResourceId: this.marketplaceResourceId,
    });
  }

  public createInitialDataValues(granularity: GranularityLevel_TYPE): DataValue[] {
    const rootGroupSections = this.sections
      .filter(s => s.parentId === undefined)
      .filter(s => s.type === SectionType.GROUP);
    const relevantGroupSections = rootGroupSections.concat(
      rootGroupSections
        .map(g => g.subSections.map(s => this.findSectionByIdOrFail(s)))
        .flat(),
    );

    return relevantGroupSections
      .map(s =>
        s.dataFields
          .filter(f => f.granularityLevel === granularity)
          .map(f =>
            DataValue.create({
              dataSectionId: s.id,
              dataFieldId: f.id,
              value: undefined,
              row: 0,
            }),
          ),
      )
      .flat();
  }

  private convertToSubmodelElement(section: Section): SubmodelElementCollection {
    const subSectionSubmodel = SubmodelElementCollection.create({
      idShort: section.id,
      displayName: [LanguageText.create({ language: Language.de, text: section.name })],
    });
    for (const dataField of section.dataFields) {
      subSectionSubmodel.addSubmodelBase(dataField.toAas());
    }
    for (const subSection of section.subSections) {
      subSectionSubmodel.addSubmodelBase(this.convertToSubmodelElement(this.findSectionByIdOrFail(subSection)));
    }
    return subSectionSubmodel;
  }

  convertToAas() {
    const aas = AssetAdministrationShell.create({
      id: this.id,
      assetInformation: AssetInformation.create({ assetKind: AssetKind.Type }),
    });
    const submodels: Submodel[] = [];
    for (const section of this.sections.filter(s => s.parentId === undefined)) {
      const submodelId = section.type === SectionType.GROUP ? section.id : `submodel-for-${section.id}`;
      aas.addSubmodelReference(Reference.create({
        type: ReferenceTypes.ModelReference,
        keys: [Key.create({
          type: KeyTypes.Submodel,
          value: submodelId,
        })],
      }));
      const submodel = Submodel.create({
        id: submodelId,
        idShort: submodelId,
        administration: AdministrativeInformation.create({
          version: "1.0.0",
          revision: "1",
        }),
        displayName: [
          LanguageText.create({ language: Language.de, text: section.name }),
        ],
      });
      if (section.type === SectionType.GROUP) {
        for (const dataField of section.dataFields) {
          submodel.addSubmodelElement(dataField.toAas());
        }
        for (const subSection of section.subSections) {
          submodel.addSubmodelElement(this.convertToSubmodelElement(this.findSectionByIdOrFail(subSection)));
        }
      }
      else {
        submodel.addSubmodelElement(SubmodelElementList.create({
          idShort: section.id,
          displayName: [
            LanguageText.create({ language: Language.de, text: section.name }),
          ],
          typeValueListElement: AasSubmodelElements.SubmodelElementCollection,
          value: [SubmodelElementCollection.create({
            idShort: `${section.id}_0`,
            value: [
              ...section.dataFields.map(d => d.toAas()),
              ...section.subSections.map(subS => this.convertToSubmodelElement(this.findSectionByIdOrFail(subS))),
            ],
          })],
        }));
      }
      submodels.push(submodel);
    }
    return Environment.create({ assetAdministrationShells: [aas.id], submodels: submodels.map(s => s.id) });
  }
}
