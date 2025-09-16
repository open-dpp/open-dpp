import {
  AssetAdministrationShellType,
  createAasForType,
} from './asset-administration-shell';

describe('AssetAdministrationShell', () => {
  it('should be create from truck', () => {
    const truck = createAasForType(AssetAdministrationShellType.Truck);

    expect(
      truck.findPropertyByIdShorts(
        'Nameplate',
        'ManufacturerProductDesignation',
      ),
    ).toEqual({
      property: {
        value: 'Truck',
        valueType: 'xs:string',
        idShort: 'ManufacturerProductDesignation',
        modelType: 'Property',
      },
      parentIdShort: 'Nameplate',
    });

    expect(
      truck.findPropertyByIdShorts('Semitrailer', 'GlobalAssetId'),
    ).toEqual({
      property: {
        idShort: 'GlobalAssetId',
        valueType: 'xs:string',
        modelType: 'Property',
        value: 'Semitrailer_-10204004-0010-01',
      },
      parentIdShort: 'Semitrailer',
    });
  });

  it('should be create from semitrailer', () => {
    const semitrailer = createAasForType(
      AssetAdministrationShellType.Semitrailer,
    );
    expect(
      semitrailer.findPropertyByIdShorts(
        'Nameplate',
        'ManufacturerProductDesignation',
      ),
    ).toEqual({
      property: {
        value: 'Semitrailer',
        valueType: 'xs:string',
        idShort: 'ManufacturerProductDesignation',
        modelType: 'Property',
      },
      parentIdShort: 'Nameplate',
    });
  });

  it('should be create from semitrailer truck', () => {
    const semitrailerTruck = createAasForType(
      AssetAdministrationShellType.Semitrailer_Truck,
    );
    expect(
      semitrailerTruck.findPropertyByIdShorts(
        'Nameplate',
        'ManufacturerProductDesignation',
      ),
    ).toEqual({
      property: {
        value: 'Semitrailer_Truck',
        valueType: 'xs:string',
        idShort: 'ManufacturerProductDesignation',
        modelType: 'Property',
      },
      parentIdShort: 'Nameplate',
    });
  });

  it('should be create from semitrailer truck', () => {
    const semitrailerTruck = createAasForType(
      AssetAdministrationShellType.Semitrailer_Truck,
    );
    expect(semitrailerTruck.globalAssetId).toEqual(
      'Semitrailer_Truck_-10204004-0010-02',
    );
  });
});
