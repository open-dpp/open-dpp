import { beforeAll, expect } from "@jest/globals";
import { AasSubmodelElements, DataTypeDef } from "@open-dpp/dto";
import { LanguageText } from "./common/language-text";
import { File } from "./submodel-base/file";
import { Property } from "./submodel-base/property";
import { registerSubmodelElementClasses } from "./submodel-base/register-submodel-element-classes";
import { Submodel } from "./submodel-base/submodel";
import { IdShortPath } from "./submodel-base/submodel-base";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";

describe("modifier visitor", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const existingDisplayNames = [LanguageText.create({ language: "en", text: "Submodel Carbon Footprint" })];
  const existingDescriptions = [LanguageText.create({
    language: "en",
    text: "The Submodel Carbon Footprint OLD",
  })];

  const newDisplayNames = [{
    language: "de",
    text: "CO2 Footprint New Text",
  }];
  const newDescriptions = [{
    language: "en",
    text: "The Submodel Carbon Footprint NEW",
  }, {
    language: "de",
    text: "Das Submodel liefert CO2",
  }];
  const sharedModifications = { displayName:
    newDisplayNames, description: newDescriptions };

  it("should modify submodel", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames, description: existingDescriptions });
    submodel.modify({ idShort: "s1", ...sharedModifications });
    expect(submodel.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
    expect(submodel.description).toEqual(newDescriptions.map(LanguageText.fromPlain));
  });

  it.each([{
    item: Property.create({ idShort: "prop1", displayName: existingDisplayNames, description: existingDescriptions, valueType: DataTypeDef.String }),
    modifications: { ...sharedModifications, value: "prop New" },
  }, {
    item: File.create({ idShort: "prop1", displayName: existingDisplayNames, description: existingDescriptions, contentType: "image/png" }),
    modifications: { ...sharedModifications, value: "path New", contentType: "image/jpeg" },
  }, {
    item: SubmodelElementCollection.create({ idShort: "prop2", displayName: existingDisplayNames, description: existingDescriptions }),
    modifications: { ...sharedModifications, value: [] },
  }])("should modify submodel element with type", ({ item, modifications }) => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames, description: existingDescriptions });
    submodel.addSubmodelElement(item);
    submodel.modifySubmodelElement({ idShort: item.idShort, ...modifications }, IdShortPath.create({ path: item.idShort }));
    expect(item.toPlain()).toMatchObject(
      {
        ...modifications,
      },
    );
  });

  it("should modify submodel element list", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames, description: existingDescriptions });
    const listItem = SubmodelElementList.create({ idShort: "list", displayName: existingDisplayNames, description: existingDescriptions, typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    const collection = SubmodelElementCollection.create({ idShort: "collection", displayName: existingDisplayNames, description: existingDescriptions });
    const property = Property.create({ idShort: "prop1", displayName: existingDisplayNames, description: existingDescriptions, valueType: DataTypeDef.String });
    collection.addSubmodelElement(property);
    listItem.addSubmodelElement(collection);
    submodel.addSubmodelElement(listItem);
    const modifications = {
      idShort: "list",
      displayName: newDisplayNames,
      description: newDescriptions,
      value: [{ idShort: "collection", displayName: newDisplayNames, value: [{ idShort: "prop1", value: "prop New" }] }],
    };
    submodel.modifySubmodelElement(modifications, IdShortPath.create({ path: "list" }));
    expect(listItem.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
    expect(listItem.description).toEqual(newDescriptions.map(LanguageText.fromPlain));
    expect(collection.displayName).toEqual(newDisplayNames.map(LanguageText.fromPlain));
    expect(property.value).toEqual("prop New");
  });
});
