import { AasSubmodelElements, DataTypeDef, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { Key } from "./common/key";
import { LanguageText } from "./common/language-text";
import { Reference } from "./common/reference";
import { File } from "./submodel-base/file";
import { MultiLanguageProperty } from "./submodel-base/multi-language-property";
import { Property } from "./submodel-base/property";
import { ReferenceElement } from "./submodel-base/reference-element";
import { registerSubmodelElementClasses } from "./submodel-base/register-submodel-element-classes";
import { Submodel } from "./submodel-base/submodel";
import { IdShortPath } from "./submodel-base/submodel-base";
import { SubmodelElementCollection } from "./submodel-base/submodel-element-collection";
import { SubmodelElementList } from "./submodel-base/submodel-element-list";

describe("value modifier visitor", () => {
  beforeAll(() => {
    registerSubmodelElementClasses();
  });

  const existingDisplayNames = [LanguageText.create({ language: "en", text: "Submodel Carbon Footprint" })];

  it("should modify value of property", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames });
    const property = Property.create({
      idShort: "prop1",
      displayName: existingDisplayNames,
      valueType: DataTypeDef.String,
      value: "old",
    });
    submodel.addSubmodelElement(property);
    const modifications = "value new";
    submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "prop1" }));
    expect(property.value).toEqual("value new");
  });

  it("should modify value of file", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames });
    const file = File.create({
      idShort: "file",
      displayName: existingDisplayNames,
      contentType: "image/png",
      value: "idToFile",
    });
    submodel.addSubmodelElement(file);
    let modifications: any = { value: "value new", contentType: "image/jpeg" };
    submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "file" }));
    expect(file.value).toEqual("value new");
    expect(file.contentType).toEqual("image/jpeg");
    modifications = { value: null, contentType: undefined };
    submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "file" }));
    expect(file.value).toBeNull();
    expect(file.contentType).toEqual("image/jpeg");
  });

  it("should modify value of reference element", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames });
    const referenceElement = ReferenceElement.create({
      idShort: "ref",
      displayName: existingDisplayNames,
      value: Reference.create({
        type: ReferenceTypes.ExternalReference,
        keys: [
          Key.create({
            type: KeyTypes.GlobalReference,
            value: "https://example.com/ref/1234567890",
          }),
        ],
      }),
    });
    const path = IdShortPath.create({ path: "ref" });
    submodel.addSubmodelElement(referenceElement);
    let modifications: any = { keys: [{ type: KeyTypes.GlobalReference, value: "https://example.com/ref/other" }] };
    submodel.modifyValueOfSubmodelElement(modifications, path);

    modifications = { type: ReferenceTypes.ModelReference, keys: [{ type: KeyTypes.AssetAdministrationShell, value: "https://example.com/ref/other" }] };
    submodel.modifyValueOfSubmodelElement(modifications, path);
    // Undefined value should not change reference element value
    submodel.modifyValueOfSubmodelElement(undefined, path);
    expect(referenceElement.value?.type).toEqual(ReferenceTypes.ModelReference);
    expect(referenceElement.value?.keys[0].type).toEqual(KeyTypes.AssetAdministrationShell);
    expect(referenceElement.value?.keys[0].value).toEqual("https://example.com/ref/other");

    modifications = null;
    submodel.modifyValueOfSubmodelElement(modifications, path);
    expect(referenceElement.value).toBeNull();
  });

  it("should modify value of submodel element list", () => {
    const submodel = Submodel.create({ id: "s1", idShort: "s1", displayName: existingDisplayNames });
    const listItem = SubmodelElementList.create({ idShort: "list", displayName: existingDisplayNames, typeValueListElement: AasSubmodelElements.SubmodelElementCollection });
    const collection = SubmodelElementCollection.create({ idShort: "collection", displayName: existingDisplayNames });
    const property = Property.create({ idShort: "prop1", displayName: existingDisplayNames, valueType: DataTypeDef.String });
    const multiLanguageProperty = MultiLanguageProperty.create({
      idShort: "prop2",
      displayName: existingDisplayNames,
      value: [LanguageText.create({ language: "en", text: "english" })],
    });

    collection.addSubmodelElement(property);
    collection.addSubmodelElement(multiLanguageProperty);
    listItem.addSubmodelElement(collection);
    submodel.addSubmodelElement(listItem);
    const modifications = [{
      prop1: "prop New",
      prop2: [{ de: "CO2 Footprint New Text" }],
    }];
    submodel.modifyValueOfSubmodelElement(modifications, IdShortPath.create({ path: "list" }));
    expect(property.value).toEqual("prop New");
    expect(property.displayName).toEqual(existingDisplayNames.map(LanguageText.fromPlain));
    expect(multiLanguageProperty.value).toEqual([LanguageText.create({ language: "de", text: "CO2 Footprint New Text" })]);
  });
});
