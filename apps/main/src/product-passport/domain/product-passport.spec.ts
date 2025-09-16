import { Template } from '../../templates/domain/template';
import {
  PhoneFactory,
  phoneFactory,
  phoneItemFactory,
  phoneModelFactory,
} from '../fixtures/product-passport.factory';
import { Model } from '../../models/domain/model';
import { Item } from '../../items/domain/item';
import { DataSection, ProductPassport } from './product-passport';

describe('ProductPassport', () => {
  const template = Template.loadFromDb(phoneFactory.addSections().build());
  const model = Model.loadFromDb(
    phoneModelFactory.addDataValues().build({ templateId: template.id }),
  );
  const item = Item.loadFromDb(
    phoneItemFactory.addDataValues().build({
      modelId: model.id,
      templateId: template.id,
    }),
  );

  it('is create at item level', () => {
    const sharedProps = { template, model, item };
    const dataSection1 = DataSection.create({
      ...sharedProps,
      section: template.findSectionById(PhoneFactory.ids.section1.id),
    });

    expect(dataSection1).toEqual(
      expect.objectContaining(
        template.findSectionById(PhoneFactory.ids.section1.id),
      ),
    );
    expect(dataSection1.dataValues).toEqual([
      {
        [PhoneFactory.ids.section1.fields.dataField1]: 'val1,0',
        [PhoneFactory.ids.section1.fields.dataField2]: 'val2,0',
      },
      {
        [PhoneFactory.ids.section1.fields.dataField1]: 'val1,1',
        [PhoneFactory.ids.section1.fields.dataField2]: 'val2,1',
      },
    ]);
    const dataSection2 = DataSection.create({
      ...sharedProps,
      section: template.findSectionById(PhoneFactory.ids.section2.id),
    });
    expect(dataSection2).toEqual(
      expect.objectContaining(
        template.findSectionById(PhoneFactory.ids.section2.id),
      ),
    );
    expect(dataSection2.dataValues).toEqual([
      {
        [PhoneFactory.ids.section2.fields.dataField3]: 'val3,0',
        [PhoneFactory.ids.section2.fields.dataField4]: 'val4,0',
      },
      {
        [PhoneFactory.ids.section2.fields.dataField3]: 'val3,1',
        [PhoneFactory.ids.section2.fields.dataField4]: 'val4,1',
      },
    ]);
    const dataSection3 = DataSection.create({
      ...sharedProps,
      section: template.findSectionById(PhoneFactory.ids.section3.id),
    });
    expect(dataSection3).toEqual(
      expect.objectContaining(
        template.findSectionById(PhoneFactory.ids.section3.id),
      ),
    );
    expect(dataSection3.dataValues).toEqual([
      {
        [PhoneFactory.ids.section3.fields.dataFieldId5]: 'val5,0',
        [PhoneFactory.ids.section3.fields.dataFieldIdForItem5]: 'val5,0,item',
      },
    ]);
    const dataSectionForItem1 = DataSection.create({
      ...sharedProps,
      section: template.findSectionById(PhoneFactory.ids.sectionForItem1.id),
    });
    expect(dataSectionForItem1).toEqual(
      expect.objectContaining(
        template.findSectionById(PhoneFactory.ids.sectionForItem1.id),
      ),
    );
    expect(dataSectionForItem1.dataValues).toEqual([
      {
        [PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem1]:
          'val1,0,item',
        [PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem2]:
          'val2,0,item',
      },
      {
        [PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem1]:
          'val1,1,item',
        [PhoneFactory.ids.sectionForItem1.fields.dataFieldIdForItem2]:
          'val2,1,item',
      },
    ]);
    const dataSectionForItem2 = DataSection.create({
      ...sharedProps,
      section: template.findSectionById(PhoneFactory.ids.sectionForItem2.id),
    });
    expect(dataSectionForItem2).toEqual(
      expect.objectContaining(
        template.findSectionById(PhoneFactory.ids.sectionForItem2.id),
      ),
    );
    expect(dataSectionForItem2.dataValues).toEqual([
      {
        [PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem3]:
          'val3,0,item',
        [PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem4]:
          'val4,0,item',
      },
      {
        [PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem3]:
          'val3,1,item',
        [PhoneFactory.ids.sectionForItem2.fields.dataFieldIdForItem4]:
          'val4,1,item',
      },
    ]);

    const productPassport = ProductPassport.create({
      uniqueProductIdentifier: item.uniqueProductIdentifiers[0],
      template: template,
      model: model,
      item: item,
    });

    expect(productPassport.id).toEqual(item.uniqueProductIdentifiers[0].uuid);
    expect(productPassport.name).toEqual(model.name);
    expect(productPassport.description).toEqual(model.description);
    expect(productPassport.dataSections).toEqual([
      dataSection1,
      dataSection2,
      dataSectionForItem1,
      dataSectionForItem2,
      dataSection3,
    ]);
  });

  it('is create at model level', () => {
    const sharedProps = { template, model };
    const dataSection1 = DataSection.create({
      ...sharedProps,
      section: template.findSectionById(PhoneFactory.ids.section1.id),
    });
    expect(dataSection1.dataValues).toEqual([
      {
        [PhoneFactory.ids.section1.fields.dataField1]: 'val1,0',
        [PhoneFactory.ids.section1.fields.dataField2]: 'val2,0',
      },
      {
        [PhoneFactory.ids.section1.fields.dataField1]: 'val1,1',
        [PhoneFactory.ids.section1.fields.dataField2]: 'val2,1',
      },
    ]);

    const dataSection3 = DataSection.create({
      ...sharedProps,
      section: template.findSectionById(PhoneFactory.ids.section3.id),
    });
    expect(dataSection3.dataValues).toEqual([
      {
        [PhoneFactory.ids.section3.fields.dataFieldId5]: 'val5,0',
      },
    ]);
    const dataSectionForItem1 = DataSection.create({
      ...sharedProps,
      section: template.findSectionById(PhoneFactory.ids.sectionForItem1.id),
    });
    expect(dataSectionForItem1.dataValues).toEqual([]);
  });

  it('is create with empty model', () => {
    const emptyModel = Model.loadFromDb(phoneModelFactory.build());
    const dataSection1 = DataSection.create({
      model: emptyModel,
      section: template.findSectionById(PhoneFactory.ids.section1.id),
    });
    expect(dataSection1.dataValues).toEqual([]);
  });
});
