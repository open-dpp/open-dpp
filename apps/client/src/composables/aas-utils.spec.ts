import {

  Language,
} from "@open-dpp/dto";

import { expect, it } from "vitest";
import { useAasUtils } from "./aas-utils.ts";

describe("aas", () => {
  it("should parse displayName from assetAdministrationShell", () => {
    const translate = (key: string) => key;

    const assetAdministrationShell = {
      displayName: [{ language: Language.en, text: "my name" }],
    };
    let aasUtils = useAasUtils({ translate, selectedLanguage: Language.en });
    expect(aasUtils.parseDisplayNameFromAas(assetAdministrationShell)).toEqual("my name");
    aasUtils = useAasUtils({ translate, selectedLanguage: Language.de });
    expect(aasUtils.parseDisplayNameFromAas(assetAdministrationShell)).toEqual(
      "common.untitled",
    );

    const environment = {
      assetAdministrationShells: [{ ...assetAdministrationShell, id: "id1" }],
    };
    aasUtils = useAasUtils({ translate, selectedLanguage: Language.en });
    expect(aasUtils.parseDisplayNameFromEnvironment(environment)).toEqual("my name");
  });
});
