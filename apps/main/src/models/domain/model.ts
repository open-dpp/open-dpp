import type { DataValue } from "../../product-passport-data/domain/data-value";
import type { Template } from "../../templates/domain/template";
import type { UniqueProductIdentifier } from "../../unique-product-identifier/domain/unique.product.identifier";
import { randomUUID } from "node:crypto";
import { ValueError } from "@open-dpp/exception";
import { GranularityLevel } from "../../data-modelling/domain/granularity-level";
import { ProductPassportData } from "../../product-passport-data/domain/product-passport-data";

interface ModelCreateProps {
  name: string;
  userId: string;
  organizationId: string;
  description?: string;
  template: Template;
}

export type ModelDbProps = Omit<ModelCreateProps, "template"> & {
  id: string;
  uniqueProductIdentifiers: UniqueProductIdentifier[];
  templateId: string;
  dataValues: DataValue[];
  description: string | undefined;
  mediaReferences: string[];
};

export class Model extends ProductPassportData {
  granularityLevel = GranularityLevel.MODEL;
  name: string;
  description: string | undefined;

  private constructor(
    id: string,
    name: string,
    public readonly mediaReferences: string[],
    ownedByOrganizationId: string,
    createdByUserId: string,
    uniqueProductIdentifiers: UniqueProductIdentifier[] = [],
    templateId: string,
    dataValues: DataValue[],
    description: string | undefined,
  ) {
    super(
      id,
      ownedByOrganizationId,
      createdByUserId,
      uniqueProductIdentifiers,
      templateId,
      dataValues,
    );
    this.name = name;
    this.description = description;
  }

  static create(data: ModelCreateProps) {
    const model = new Model(
      randomUUID(),
      data.name,
      [],
      data.organizationId,
      data.userId,
      [],
      data.template.id,
      [],
      data.description,
    );
    model.initializeDataValueFromTemplate(data.template);
    return model;
  }

  static loadFromDb(data: ModelDbProps) {
    return new Model(
      data.id,
      data.name,
      data.mediaReferences,
      data.organizationId,
      data.userId,
      data.uniqueProductIdentifiers,
      data.templateId,
      data.dataValues,
      data.description,
    );
  }

  rename(name: string) {
    this.name = name;
  }

  addMediaReference(mediaFileId: string) {
    if (!this.mediaReferences.includes(mediaFileId)) {
      this.mediaReferences.push(mediaFileId);
    }
  };

  modifyMediaReference(mediaFileId: string, newMediaFileId: string) {
    const index = this.findMediaReferenceIndexOrFail(mediaFileId);
    this.mediaReferences[index] = newMediaFileId;
  }

  private findMediaReferenceIndexOrFail(mediaFileId: string) {
    const index = this.mediaReferences.indexOf(mediaFileId);
    if (index > -1) {
      return index;
    }
    else {
      throw new ValueError(`Cannot find media reference with id ${mediaFileId}.`);
    };
  }

  deleteMediaReference(mediaFileId: string) {
    const index = this.findMediaReferenceIndexOrFail(mediaFileId);
    this.mediaReferences.splice(index, 1);
  };

  moveMediaReference(mediaFileId: string, newPosition: number) {
    if (newPosition < 0 || newPosition >= this.mediaReferences.length) {
      throw new ValueError(`Cannot move media reference to position ${newPosition}, since position is out of bounds [0, ${this.mediaReferences.length - 1}].`);
    }
    const index = this.findMediaReferenceIndexOrFail(mediaFileId);
    this.mediaReferences.splice(index, 1);
    this.mediaReferences.splice(newPosition, 0, mediaFileId);
  };

  modifyDescription(description: string | undefined) {
    this.description = description;
  }
}
