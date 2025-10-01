import { Template, TemplateDbProps } from './template';
import { DataFieldValidationResult } from './data-field';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { DataValue } from '../../product-passport-data/domain/data-value';
import { laptopFactory, LaptopFactory } from '../fixtures/laptop.factory';
import { randomUUID } from 'crypto';
import { expect } from '@jest/globals';
import { ignoreIds } from '@open-dpp/testing';

describe('Template', () => {
  const laptopModel: TemplateDbProps = laptopFactory.addSections().build();

  it('should create data values at model level', () => {
    const productDataModel = Template.loadFromDb(laptopModel);
    const dataValues = productDataModel.createInitialDataValues(
      GranularityLevel.MODEL,
    );
    expect(dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          dataSectionId: LaptopFactory.ids.techSpecs.id,
          dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: LaptopFactory.ids.techSpecs.id,
          dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: LaptopFactory.ids.environment.id,
          dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
          value: undefined,
          row: 0,
        }),
      ]),
    );
  });

  it('should create data values at item level', () => {
    const productDataModel = Template.loadFromDb(laptopModel);
    const dataValues = productDataModel.createInitialDataValues(
      GranularityLevel.ITEM,
    );
    expect(dataValues).toEqual(
      ignoreIds([
        DataValue.create({
          dataSectionId: LaptopFactory.ids.techSpecs.id,
          dataFieldId: LaptopFactory.ids.techSpecs.fields.serialNumber,
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: LaptopFactory.ids.techSpecs.id,
          dataFieldId: LaptopFactory.ids.techSpecs.fields.batteryStatus,
          value: undefined,
          row: 0,
        }),
        DataValue.create({
          dataSectionId: LaptopFactory.ids.environment.id,
          dataFieldId: LaptopFactory.ids.environment.fields.energyConsumption,
          value: undefined,
          row: 0,
        }),
      ]),
    );
  });
  //
  it('should validate values successfully', () => {
    const productDataModel = Template.loadFromDb(laptopModel);

    const dataValues = [
      DataValue.create({
        value: 'Intel 7',
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        row: 0,
      }),
      DataValue.create({
        value: 'Mem 4 GB',
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        row: 0,
      }),
      DataValue.create({
        value: 5,
        dataSectionId: LaptopFactory.ids.environment.id,
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        row: 0,
      }),
      DataValue.create({
        value: 'Lithium',
        dataSectionId: LaptopFactory.ids.material.id,
        dataFieldId: LaptopFactory.ids.material.fields.materialType,
        row: 0,
      }),
      DataValue.create({
        value: 4,
        dataSectionId: LaptopFactory.ids.material.id,
        dataFieldId: LaptopFactory.ids.material.fields.mass,
        row: 0,
      }),
      DataValue.create({
        value: 'GHG protocol',
        dataSectionId: LaptopFactory.ids.materialCo2.id,
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod,
        row: 0,
      }),
      DataValue.create({
        value: 9,
        dataSectionId: LaptopFactory.ids.materialCo2.id,
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2Emissions,
        row: 0,
      }),
    ];
    const validationOutput = productDataModel.validate(
      dataValues,
      GranularityLevel.MODEL,
    );

    expect(validationOutput.isValid).toBeTruthy();
    expect(validationOutput.validationResults).toEqual([
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        dataFieldName: 'Processor',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        dataFieldName: 'Memory',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        dataFieldName: 'Water consumption',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.material.fields.materialType,
        dataFieldName: 'Material type',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.material.fields.mass,
        dataFieldName: 'Mass',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod,
        dataFieldName: 'Co2 calculation method',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2Emissions,
        dataFieldName: 'Co2 emissions',
        isValid: true,
      }),
    ]);
  });

  it('should validate values successfully if there are no data values for repeatable section', () => {
    const productDataModel = Template.loadFromDb(laptopModel);

    const dataValues = [
      DataValue.create({
        value: 'Intel 7',
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        row: 0,
      }),
      DataValue.create({
        value: 'Mem 4 GB',
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        row: 0,
      }),
      DataValue.create({
        value: 5,
        dataSectionId: LaptopFactory.ids.environment.id,
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        row: 0,
      }),
    ];
    const validationOutput = productDataModel.validate(
      dataValues,
      GranularityLevel.MODEL,
    );

    expect(validationOutput.isValid).toBeTruthy();
    expect(validationOutput.validationResults).toEqual([
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        dataFieldName: 'Processor',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        dataFieldName: 'Memory',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        dataFieldName: 'Water consumption',
        isValid: true,
      }),
    ]);
  });

  it('should fail validation caused by missing field and wrong type', () => {
    const productDataModel = Template.loadFromDb(laptopModel);
    const dataValues = [
      DataValue.create({
        value: 'Intel 7',
        dataSectionId: LaptopFactory.ids.techSpecs.id,
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        row: 0,
      }),
      DataValue.create({
        value: 34,
        dataSectionId: LaptopFactory.ids.environment.id,
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        row: 0,
      }),
      DataValue.create({
        value: 'Lithium',
        dataSectionId: LaptopFactory.ids.material.id,
        dataFieldId: LaptopFactory.ids.material.fields.materialType,
        row: 0,
      }),
      DataValue.create({
        value: 'wrong value',
        dataSectionId: LaptopFactory.ids.material.id,
        dataFieldId: LaptopFactory.ids.material.fields.mass,
        row: 0,
      }),
      DataValue.create({
        value: { wrongValue: 'GHG protocol' },
        dataSectionId: LaptopFactory.ids.materialCo2.id,
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod,
        row: 0,
      }),
      DataValue.create({
        value: 9,
        dataSectionId: LaptopFactory.ids.materialCo2.id,
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2Emissions,
        row: 0,
      }),
    ];
    const validationOutput = productDataModel.validate(
      dataValues,
      GranularityLevel.MODEL,
    );

    expect(validationOutput.isValid).toBeFalsy();
    expect(validationOutput.validationResults).toEqual([
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.processor,
        dataFieldName: 'Processor',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.techSpecs.fields.memory,
        dataFieldName: 'Memory',
        errorMessage: 'Value for data field is missing',
        isValid: false,
        row: 0,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.environment.fields.waterConsumption,
        dataFieldName: 'Water consumption',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.material.fields.materialType,
        dataFieldName: 'Material type',
        isValid: true,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.material.fields.mass,
        dataFieldName: 'Mass',
        errorMessage: 'Invalid input: expected number, received string',
        isValid: false,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2CalculationMethod,
        dataFieldName: 'Co2 calculation method',
        errorMessage: 'Invalid input: expected string, received object',
        isValid: false,
      }),
      DataFieldValidationResult.create({
        dataFieldId: LaptopFactory.ids.materialCo2.fields.co2Emissions,
        dataFieldName: 'Co2 emissions',
        isValid: true,
      }),
    ]);
  });

  it('should copy template', () => {
    const template = Template.loadFromDb(laptopModel);
    const orgaId = randomUUID();
    const userId = randomUUID();
    const templateCopy = template.copy(orgaId, userId);
    expect(templateCopy.id).not.toEqual(template.id);
    expect(templateCopy.ownedByOrganizationId).toEqual(orgaId);
    expect(templateCopy.createdByUserId).toEqual(userId);
    expect(templateCopy.name).toEqual(template.name);
    expect(templateCopy.version).toEqual(template.version);
    expect(templateCopy.marketplaceResourceId).toEqual(
      template.marketplaceResourceId,
    );
    expect(templateCopy.sections).toEqual(template.sections);
  });

  it('should assign marketplace resource ID at the model level', () => {
    const productDataModel = Template.loadFromDb(laptopModel);
    productDataModel.assignMarketplaceResource('m1');
    expect(productDataModel.marketplaceResourceId).toEqual('m1');
  });
});
