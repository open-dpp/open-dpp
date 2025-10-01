import { randomUUID } from 'crypto';
import { UniqueProductIdentifier } from '../../unique-product-identifier/domain/unique.product.identifier';

import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { ProductPassportData } from '../../product-passport-data/domain/product-passport-data';
import { Model } from '../../models/domain/model';
import { Template } from '../../templates/domain/template';
import { DataValue } from '../../product-passport-data/domain/data-value';
import { ValueError } from '@open-dpp/exception';

export type ItemCreateProps = {
  organizationId: string;
  userId: string;
  template: Template;
  model: Model;
};
export type ItemDbProps = Omit<ItemCreateProps, 'template' | 'model'> & {
  id: string;
  uniqueProductIdentifiers: UniqueProductIdentifier[];
  templateId: string;
  dataValues: DataValue[];
  modelId: string;
};

export class Item extends ProductPassportData {
  granularityLevel = GranularityLevel.ITEM;
  private constructor(
    id: string,
    ownedByOrganizationId: string,
    createdByUserId: string,
    uniqueProductIdentifiers: UniqueProductIdentifier[],
    private _modelId: string,
    templateId: string,
    dataValues: DataValue[],
  ) {
    super(
      id,
      ownedByOrganizationId,
      createdByUserId,
      uniqueProductIdentifiers,
      templateId,
      dataValues,
    );
  }

  public static create(data: ItemCreateProps) {
    if (data.model.templateId !== data.template.id) {
      throw new ValueError('Model and template do not match');
    }
    const item = new Item(
      randomUUID(),
      data.organizationId,
      data.userId,
      [],
      data.model.id,
      data.template.id,
      [],
    );
    item.initializeDataValueFromTemplate(data.template);
    return item;
  }

  public static loadFromDb(data: ItemDbProps) {
    return new Item(
      data.id,
      data.organizationId,
      data.userId,
      data.uniqueProductIdentifiers,
      data.modelId,
      data.templateId,
      data.dataValues,
    );
  }

  get modelId() {
    return this._modelId;
  }
}
