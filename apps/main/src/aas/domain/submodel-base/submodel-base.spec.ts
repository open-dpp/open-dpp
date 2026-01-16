import { beforeAll, expect } from "@jest/globals";
import { KeyTypes } from "@open-dpp/dto";
import { LanguageText } from "../common/language-text";
import { registerSubmodelElementClasses } from "./register-submodel-element-classes";
import { Submodel } from "./submodel";

describe("submodel base", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const existingDisplayNames = [LanguageText.create({ language: "en", text: "Submodel Carbon Footprint" })];
  const existingDescriptions = [LanguageText.create({
    language: "en",
    text: "The Submodel Carbon Footprint OLD",
  })];

  it.each([{
    item: Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames, description: existingDescriptions }),
    type: KeyTypes.Submodel,
  }])("should modify $type", ({ item }) => {
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
    item.modify({ displayName: [
      newGermanDisplayName,
    ], description: newDescriptions });
    expect(item.displayName).toEqual([
      existingDisplayNames.find(languageText => languageText.language === "en")!,
      LanguageText.fromPlain(
        newGermanDisplayName,
      ),
    ]);
    expect(item.description).toEqual(newDescriptions.map(description => LanguageText.fromPlain(description)));
  });
});
