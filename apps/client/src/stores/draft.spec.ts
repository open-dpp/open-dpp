import type {
  DataFieldDto,
  SectionDto,
  TemplateDraftDto,
} from "@open-dpp/api-client";
import {
  DataFieldType,
  GranularityLevel,
  MoveDirection,
  MoveType,
  SectionType,
  Sector,
  VisibilityLevel,
} from "@open-dpp/api-client";
import { waitFor } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import apiClient from "../lib/api-client";
import { useDraftStore } from "./draft";

const mocks = vi.hoisted(() => {
  return {
    getDraftId: vi.fn(),
    create: vi.fn(),
    addSection: vi.fn(),
    deleteSection: vi.fn(),
    addDataField: vi.fn(),
    deleteDataField: vi.fn(),
    modifySection: vi.fn(),
    moveSection: vi.fn(),
    modifyDataField: vi.fn(),
    moveDataField: vi.fn(),
    publish: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templateDrafts: {
        getById: mocks.getDraftId,
        addSection: mocks.addSection,
        addDataField: mocks.addDataField,
        deleteSection: mocks.deleteSection,
        deleteDataField: mocks.deleteDataField,
        modifySection: mocks.modifySection,
        moveSection: mocks.moveSection,
        modifyDataField: mocks.modifyDataField,
        moveDataField: mocks.moveDataField,
        publish: mocks.publish,
        create: mocks.create,
      },
    },
  },
}));

describe("draftStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  const section: SectionDto = {
    id: "s1",
    name: "Tech Specs",
    type: SectionType.GROUP,
    dataFields: [
      {
        id: "d1",
        name: "Processor",
        type: DataFieldType.TEXT_FIELD,
        options: {},
        granularityLevel: GranularityLevel.MODEL,
      },
      {
        id: "d2",
        name: "Memory",
        type: DataFieldType.NUMERIC_FIELD,
        options: {},
        granularityLevel: GranularityLevel.MODEL,
      },
    ],
    subSections: [],
  };

  const draft: TemplateDraftDto = {
    id: "draftId",
    name: "My draft",
    description: "Draft desc",
    sectors: [Sector.BATTERY],
    version: "1.0.0",
    publications: [],
    sections: [section],
    createdByUserId: "u1",
    ownedByOrganizationId: "u2",
  };

  it("should create draft", async () => {
    const draftStore = useDraftStore();
    mocks.create.mockResolvedValue({ data: draft });
    const createDto = {
      name: "My draft",
      description: "My draft description",
      sectors: [Sector.BATTERY],
    };
    await draftStore.createDraft(createDto);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.create).toHaveBeenCalledWith(
        createDto,
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should fetch draft", async () => {
    const draftStore = useDraftStore();
    mocks.getDraftId.mockResolvedValue({ data: draft });
    await draftStore.fetchDraft(draft.id);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.getById).toHaveBeenCalledWith(
        draft.id,
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should add section", async () => {
    const draftStore = useDraftStore();
    mocks.addSection.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    const newSection = {
      name: "My new section",
      type: SectionType.GROUP,
    };
    await draftStore.addSection(newSection);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.addSection).toHaveBeenCalledWith(
        draft.id,
        newSection,
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should modify section", async () => {
    const draftStore = useDraftStore();
    mocks.modifySection.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    const modifySection = {
      name: "My new section name",
    };
    await draftStore.modifySection(section.id, modifySection);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.modifySection).toHaveBeenCalledWith(
        draft.id,
        section.id,
        modifySection,
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should move section", async () => {
    const draftStore = useDraftStore();
    mocks.moveSection.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    await draftStore.moveSectionUp(section.id);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.moveSection).toHaveBeenCalledWith(
        draft.id,
        section.id,
        { type: MoveType.POSITION, direction: MoveDirection.UP },
      ),
    );
    expect(draftStore.draft).toEqual(draft);
    await draftStore.moveSectionDown(section.id);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.moveSection).toHaveBeenCalledWith(
        draft.id,
        section.id,
        { type: MoveType.POSITION, direction: MoveDirection.DOWN },
      ),
    );
  });

  it("should move data field", async () => {
    const draftStore = useDraftStore();
    mocks.moveDataField.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    await draftStore.moveDataFieldUp("d2");
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.moveDataField).toHaveBeenCalledWith(
        draft.id,
        section.id,
        "d2",
        { type: MoveType.POSITION, direction: MoveDirection.UP },
      ),
    );
    expect(draftStore.draft).toEqual(draft);
    await draftStore.moveDataFieldDown("d2");
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.moveDataField).toHaveBeenCalledWith(
        draft.id,
        section.id,
        "d2",
        { type: MoveType.POSITION, direction: MoveDirection.DOWN },
      ),
    );
  });

  it("should add data field", async () => {
    const draftStore = useDraftStore();
    mocks.addDataField.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    const sectionId = "sectionId";
    const newDataField = {
      name: "My new data field",
      type: DataFieldType.TEXT_FIELD,
      granularityLevel: GranularityLevel.MODEL,
    };
    await draftStore.addDataField(sectionId, newDataField);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.addDataField).toHaveBeenCalledWith(
        draft.id,
        sectionId,
        newDataField,
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should delete section", async () => {
    const draftStore = useDraftStore();
    mocks.deleteSection.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    const sectionId = "sectionId";
    await draftStore.deleteSection(sectionId);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.deleteSection).toHaveBeenCalledWith(
        draft.id,
        sectionId,
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should delete data field", async () => {
    const draftStore = useDraftStore();
    mocks.deleteDataField.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    const dataFieldId = (section.dataFields[0] as DataFieldDto).id;
    await draftStore.deleteDataField(dataFieldId);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.deleteDataField).toHaveBeenCalledWith(
        draft.id,
        section.id,
        dataFieldId,
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should modify data field", async () => {
    const draftStore = useDraftStore();
    mocks.modifyDataField.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    const dataFieldId = (section.dataFields[0] as DataFieldDto).id;
    const modification = {
      name: "new name",
      options: { min: 2 },
    };
    await draftStore.modifyDataField(dataFieldId, modification);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.modifyDataField).toHaveBeenCalledWith(
        draft.id,
        section.id,
        dataFieldId,
        modification,
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should publish draft", async () => {
    const draftStore = useDraftStore();
    mocks.publish.mockResolvedValue({ data: draft });
    draftStore.draft = draft;
    const publishRequest = { visibility: VisibilityLevel.PRIVATE };
    await draftStore.publish(publishRequest);
    await waitFor(() =>
      expect(apiClient.dpp.templateDrafts.publish).toHaveBeenCalledWith(
        draft.id,
        { ...publishRequest, sectors: draft.sectors },
      ),
    );
    expect(draftStore.draft).toEqual(draft);
  });

  it("should find section by id", async () => {
    const draftStore = useDraftStore();
    draftStore.draft = draft;
    const found = draftStore.findSectionById(section.id);
    expect(found).toEqual(section);
  });
});
