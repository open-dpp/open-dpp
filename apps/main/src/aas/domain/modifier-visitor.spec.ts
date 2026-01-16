import { beforeAll, expect } from "@jest/globals";
import { DataTypeDef } from "@open-dpp/dto";
import { LanguageText } from "./common/language-text";
import { Property } from "./submodel-base/property";
import { registerSubmodelElementClasses } from "./submodel-base/register-submodel-element-classes";
import { Submodel } from "./submodel-base/submodel";
import { IdShortPath } from "./submodel-base/submodel-base";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";

describe("modifier visitor", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const existingDisplayNames = [LanguageText.create({ language: "en", text: "Submodel Carbon Footprint" })];
  const existingDescriptions = [LanguageText.create({
    language: "en",
    text: "The Submodel Carbon Footprint OLD",
  })];

  const newGermanDisplayName = {
    language: "de",
    text: "CO2 Footprint New Text",
  };
  const newDescriptions = [{
    language: "en",
    text: "The Submodel Carbon Footprint NEW",
  }, {
    language: "de",
    text: "Das Submodel liefert CO2",
  }];
  const sharedModifications = { displayName: [
    newGermanDisplayName,
  ], description: newDescriptions };

  it("should modify submodel", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames, description: existingDescriptions });
    submodel.modify(sharedModifications);
    expect(submodel.displayName).toEqual([
      existingDisplayNames.find(languageText => languageText.language === "en")!,
      LanguageText.fromPlain(
        newGermanDisplayName,
      ),
    ]);
    expect(submodel.description).toEqual(newDescriptions.map(description => LanguageText.fromPlain(description)));
  });

  it.each([{
    item: Property.create({ idShort: "prop1", displayName: existingDisplayNames, description: existingDescriptions, valueType: DataTypeDef.String }),
    modifications: { ...sharedModifications, value: "prop New" },
  }, {
    item: SubmodelElementCollection.create({ idShort: "prop2", displayName: existingDisplayNames, description: existingDescriptions }),
    modifications: { ...sharedModifications, value: [] },
  }])("should modify submodel element with type $type", ({ item, modifications }) => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames, description: existingDescriptions });
    submodel.addSubmodelElement(item);
    submodel.modifySubmodelElement(modifications, IdShortPath.create({ path: item.idShort }));
    expect({ displayName: item.displayName, description: item.description, value: item.value }).toEqual(
      {
        ...modifications,
        displayName: [
          existingDisplayNames.find(languageText => languageText.language === "en")!,
          LanguageText.fromPlain(
            newGermanDisplayName,
          ),
        ],
        description: existingDescriptions,
      },
    );
  });
});
