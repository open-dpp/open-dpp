import { z } from 'zod';
import { flatMap, get } from 'lodash';
import { semitrailerTruckAas } from './semitrailer-truck-aas';
import { truckAas } from './truck';
import { semitrailerAas } from './semitrailer';

export enum AssetAdministrationShellType {
  Truck = 'Truck',
  Semitrailer = 'Semitrailer',
  Semitrailer_Truck = 'Semitrailer_Truck',
}

const AASPropertySchema = z.object({
  idShort: z.string(),
  value: z.string().optional(),
  valueType: z.string().prefault('xs:string'),
  modelType: z.literal('Property'),
});

export type AasProperty = z.infer<typeof AASPropertySchema>;

export const AASPropertyWithParentSchema = z.object({
  parentIdShort: z.string().nullable(),
  property: AASPropertySchema,
});

export const AssetAdministrationShellsSchema = z.object({
  assetAdministrationShells: z
    .object({
      assetInformation: z.object({
        assetKind: z.string(),
        assetType: z.string(),
        globalAssetId: z.string(),
      }),
    })
    .array(),
});

export type AASPropertyWithParent = z.infer<typeof AASPropertyWithParentSchema>;

export class AssetAdministrationShell {
  private constructor(
    public readonly globalAssetId: string,
    public readonly propertiesWithParent: AASPropertyWithParent[],
  ) {}

  static create(data: { content: any }) {
    const collectedProperties = flatMap(data.content.submodels, (submodel) =>
      AssetAdministrationShell.collectElementsWithParent(
        submodel.submodelElements || [],
        submodel.idShort,
      ),
    );
    const allProperties =
      AASPropertyWithParentSchema.array().parse(collectedProperties);
    const globalAssetId = AssetAdministrationShellsSchema.parse(data.content)
      .assetAdministrationShells[0].assetInformation.globalAssetId;
    return new AssetAdministrationShell(globalAssetId, allProperties);
  }

  private static parseElement(el: any) {
    const modelType = get(el, 'modelType');
    if (modelType === 'Property') {
      const property = AASPropertySchema.parse(el);
      return AASPropertySchema.parse({
        idShort: property.idShort,
        value: property.value,
        valueType: property.valueType,
        modelType: property.modelType,
      });
    }
    return undefined;
  }

  private static getSubElements(el: any) {
    if (el.value) {
      return el.value;
    }
    if (el.statements) {
      return el.statements;
    }
    return [];
  }

  private static collectElementsWithParent(
    elements: any[],
    parentIdShort: string | null = null,
  ): { parentIdShort: string | null; property: AasProperty }[] {
    return flatMap(elements, (el) => {
      const property = AssetAdministrationShell.parseElement(el);
      const subElements = AssetAdministrationShell.getSubElements(el);
      const nested =
        subElements.length > 0
          ? this.collectElementsWithParent(
              subElements,
              el.idShort || el.globalAssetID || null,
            )
          : [];

      return property ? [{ parentIdShort, property: el }, ...nested] : nested;
    });
  }

  findPropertyByIdShorts(parentIdShort: string, idShort: string) {
    return this.propertiesWithParent.find(
      (propertyWithParent) =>
        propertyWithParent.property.idShort === idShort &&
        propertyWithParent.parentIdShort === parentIdShort,
    );
  }
}

const AssetAdministrationShellData = {
  [AssetAdministrationShellType.Truck]: truckAas,
  [AssetAdministrationShellType.Semitrailer]: semitrailerAas,
  [AssetAdministrationShellType.Semitrailer_Truck]: semitrailerTruckAas,
};

export function createAasForType(aasType: AssetAdministrationShellType) {
  return AssetAdministrationShell.create({
    content: AssetAdministrationShellData[aasType],
  });
}
