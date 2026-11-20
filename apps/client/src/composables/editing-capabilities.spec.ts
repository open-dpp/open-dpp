import {
  DigitalProductDocumentStatusDto,
  EditingModeDto,
  type DigitalProductDocumentStatusDtoType,
  type EditingModeDtoType,
} from "@open-dpp/dto";
import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { useEditingCapabilities } from "./editing-capabilities.ts";

describe("useEditingCapabilities", () => {
  it.each([
    [EditingModeDto.Full, DigitalProductDocumentStatusDto.Draft, true, true, false, false],
    [EditingModeDto.Full, DigitalProductDocumentStatusDto.Published, true, true, false, false],
    [EditingModeDto.DataOnly, DigitalProductDocumentStatusDto.Draft, false, true, false, true],
    [EditingModeDto.DataOnly, DigitalProductDocumentStatusDto.Published, false, true, false, true],
    [EditingModeDto.ReadOnly, DigitalProductDocumentStatusDto.Published, false, false, true, false],
    [EditingModeDto.Full, DigitalProductDocumentStatusDto.Archived, false, false, true, false],
    [EditingModeDto.DataOnly, DigitalProductDocumentStatusDto.Archived, false, false, true, false],
  ] as const)(
    "%s + %s => structure %s, data %s, readOnly %s, restrictedToData %s",
    (mode, status, structure, data, readOnly, restrictedToData) => {
      const capabilities = useEditingCapabilities(mode, status);

      expect(capabilities.canEditStructure.value).toBe(structure);
      expect(capabilities.canEditData.value).toBe(data);
      expect(capabilities.isReadOnly.value).toBe(readOnly);
      expect(capabilities.isEditingRestrictedToData.value).toBe(restrictedToData);
    },
  );

  it("treats a missing editing mode as Full", () => {
    const capabilities = useEditingCapabilities(undefined, DigitalProductDocumentStatusDto.Draft);

    expect(capabilities.canEditStructure.value).toBe(true);
    expect(capabilities.canEditData.value).toBe(true);
  });

  it("follows reactive inputs", () => {
    const mode = ref<EditingModeDtoType>(EditingModeDto.Full);
    const status = ref<DigitalProductDocumentStatusDtoType>(DigitalProductDocumentStatusDto.Draft);
    const capabilities = useEditingCapabilities(mode, status);
    expect(capabilities.canEditStructure.value).toBe(true);

    mode.value = EditingModeDto.ReadOnly;
    expect(capabilities.canEditStructure.value).toBe(false);
    expect(capabilities.canEditData.value).toBe(false);

    mode.value = EditingModeDto.Full;
    status.value = DigitalProductDocumentStatusDto.Archived;
    expect(capabilities.isReadOnly.value).toBe(true);
  });
});
