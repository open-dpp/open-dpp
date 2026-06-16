import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyTypes, Language } from "@open-dpp/dto";
import type {
  SubmodelElementCollectionResponseDto,
  SubmodelElementResponseDto,
} from "@open-dpp/dto";
import { buildColumns } from "./list-columns";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";

function makeFileRow(): SubmodelElementCollectionResponseDto {
  const value: SubmodelElementResponseDto[] = [
    {
      modelType: KeyTypes.File,
      idShort: "photo",
      displayName: [{ language: "en-US", text: "Photo" }],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: "some-media-id",
    } as unknown as SubmodelElementResponseDto,
    {
      modelType: KeyTypes.Property,
      idShort: "name",
      displayName: [{ language: "en-US", text: "Name" }],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: "Alice",
    } as unknown as SubmodelElementResponseDto,
  ];
  return {
    modelType: KeyTypes.SubmodelElementCollection,
    idShort: "row0",
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value,
  } as unknown as SubmodelElementCollectionResponseDto;
}

function makePropertyOnlyRow(): SubmodelElementCollectionResponseDto {
  const value: SubmodelElementResponseDto[] = [
    {
      modelType: KeyTypes.Property,
      idShort: "name",
      displayName: [{ language: "en-US", text: "Name" }],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: "Alice",
    } as unknown as SubmodelElementResponseDto,
  ];
  return {
    modelType: KeyTypes.SubmodelElementCollection,
    idShort: "row0",
    displayName: [],
    description: [],
    supplementalSemanticIds: [],
    qualifiers: [],
    embeddedDataSpecifications: [],
    value,
  } as unknown as SubmodelElementCollectionResponseDto;
}

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: Language["en-US"] },
  }),
  createI18n: () => ({
    global: {
      t: (key: string) => key,
      locale: { value: Language["en-US"] },
    },
    install: () => {},
  }),
}));


describe("buildColumns", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function buildColumnsWithHarness(content: SubmodelElementCollectionResponseDto[]) {
    const Harness = defineComponent({
      name: "use-aas-utils-harness",
      setup() {
        const result = buildColumns(content);
        return { result };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);

    return wrapper.vm.result;
  }

  afterEach(() => {
    mountedWrappers.splice(0).forEach((w) => {
      w.unmount();
    });
  });

  it("returns an empty array when content is empty", () => {
    expect(buildColumnsWithHarness([])).toEqual([]);
  });

  it("returns an empty array when the first row has no value", () => {
    const row = {
      modelType: KeyTypes.SubmodelElementCollection,
      idShort: "row0",
      displayName: [],
      description: [],
      supplementalSemanticIds: [],
      qualifiers: [],
      embeddedDataSpecifications: [],
      value: undefined,
    } as unknown as SubmodelElementCollectionResponseDto;
    const result = buildColumnsWithHarness([row]);
    expect(result).toEqual([]);
  });

  it("sets minWidth on File-type columns", () => {
    const cols = buildColumnsWithHarness([makeFileRow()]);
    const fileCol = cols.find((c) => c.field === "photo");
    expect(fileCol).toBeDefined();
    expect(fileCol?.style).toMatchObject({ minWidth: "200px" });
  });

  it("does not set minWidth on non-File columns", () => {
    const cols = buildColumnsWithHarness([makeFileRow()]);
    const nameCol = cols.find((c) => c.field === "name");
    expect(nameCol).toBeDefined();
    expect(nameCol?.style).toBeUndefined();
  });

  it("no column has minWidth when there are only Property columns", () => {
    const cols = buildColumnsWithHarness([makePropertyOnlyRow()]);
    for (const col of cols) {
      expect(col.style).toBeUndefined();
    }
  });

  it("uses the first available displayName as header", () => {
    const cols = buildColumnsWithHarness([makeFileRow()]);
    const fileCol = cols.find((c) => c.field === "photo");
    expect(fileCol?.header).toBe("Photo");
  });
});
