import { DisplayNameChanged } from "./language-text-collection-changed";
import { LanguageText } from "../../../aas/domain/common/language-text";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";

describe("LanguageTextCollectionChanged", () => {
  it("should generate replace and remove operations", () => {
    const oldValue = [
      LanguageText.create({
        language: "en",
        text: "before",
      }),
      LanguageText.create({
        language: "de",
        text: "vorher",
      }),
    ];
    const newValue = [
      LanguageText.create({
        language: "en",
        text: "after",
      }),
    ];
    const displayNameChanged = DisplayNameChanged.create({
      path: IdShortPath.create({ path: "path" }),
      oldValue,
      newValue,
    });
    expect(displayNameChanged.values).toEqual([
      {
        lng: "en",
        op: "replace",
        oldValue: "before",
        newValue: "after",
      },
      {
        lng: "de",
        op: "remove",
        oldValue: "vorher",
        newValue: null,
      },
    ]);
  });

  it("should ignore replace with same text", () => {
    const oldValue = [
      LanguageText.create({
        language: "en",
        text: "before",
      }),
      LanguageText.create({
        language: "de",
        text: "vorher",
      }),
    ];
    const newValue = [
      LanguageText.create({
        language: "en",
        text: "before",
      }),
      LanguageText.create({
        language: "de",
        text: "vorher",
      }),
    ];
    const displayNameChanged = DisplayNameChanged.create({
      path: IdShortPath.create({ path: "path" }),
      oldValue,
      newValue,
    });
    expect(displayNameChanged.values).toEqual([]);
  });

  it("should generate add and remove operations", () => {
    const oldValue = [
      LanguageText.create({
        language: "de",
        text: "vorher",
      }),
    ];
    const newValue = [
      LanguageText.create({
        language: "en",
        text: "after",
      }),
    ];
    const displayNameChanged = DisplayNameChanged.create({
      path: IdShortPath.create({ path: "path" }),
      oldValue,
      newValue,
    });
    expect(displayNameChanged.values).toEqual([
      {
        lng: "en",
        op: "add",
        oldValue: null,
        newValue: "after",
      },
      {
        lng: "de",
        op: "remove",
        oldValue: "vorher",
        newValue: null,
      },
    ]);
  });

  it("should handle no operations", () => {
    const oldValue = [
      LanguageText.create({
        language: "de",
        text: "vorher",
      }),
    ];
    const newValue = [
      LanguageText.create({
        language: "de",
        text: "after",
      }),
    ];
    const displayNameChanged = DisplayNameChanged.create({
      path: IdShortPath.create({ path: "path" }),
      oldValue,
      newValue,
    });
    expect(displayNameChanged.values).toEqual([
      {
        lng: "de",
        op: "replace",
        oldValue: "vorher",
        newValue: "after",
      },
    ]);
  });
});
