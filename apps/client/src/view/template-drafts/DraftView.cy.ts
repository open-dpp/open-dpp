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
} from "@open-dpp/api-client";

import { createMemoryHistory, createRouter } from "vue-router";
import { API_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import TestWrapper from "../../testing-utils/TestWrapper.vue";
import DraftView from "./DraftView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<DraftView />", () => {
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
        type: DataFieldType.TEXT_FIELD,
        options: {},
        granularityLevel: GranularityLevel.MODEL,
      },
    ],
    subSections: [],
  };

  const repeatableSection: SectionDto = {
    id: "s2",
    name: "Materials",
    type: SectionType.REPEATABLE,
    dataFields: [],
    subSections: [],
    granularityLevel: GranularityLevel.ITEM,
  };

  const draft: TemplateDraftDto = {
    id: "draftId",
    name: "My draft",
    description: "My description",
    sectors: [Sector.BATTERY],
    version: "1.0.0",
    publications: [],
    sections: [section, repeatableSection],
    createdByUserId: "u1",
    ownedByOrganizationId: "o1",
  };

  it("renders draft and creates a section", () => {
    const orgaId = "orgaId";
    const newSectionName = "Sustainability";

    const sectionToCreate = {
      id: "sCreate1",
      name: newSectionName,
      type: SectionType.REPEATABLE,
      dataFields: [],
      subSections: [],
      granularityLevel: GranularityLevel.MODEL,
    };

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
      {
        statusCode: 200,
        body: draft, // Mock response
      },
    ).as("getDraft");

    cy.intercept(
      "POST",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: [...draft.sections, sectionToCreate],
        },
      },
    ).as("createSection");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.wrap(
      router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
    );
    cy.mountWithPinia(DraftView, { router });

    cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
    cy.contains(`Passvorlagen Entwurf ${draft.name}`).should("be.visible");
    cy.contains(`Version ${draft.version}`).should("be.visible");
    cy.contains("button", "Abschnitt hinzufügen").click();

    cy.contains(`Auswahl`).should("be.visible");
    // Check that no data fields are selectable
    cy.contains("li", "Textfeld").should("not.exist");
    cy.contains("li", "Repeater").click();
    cy.get("[data-cy=\"name\"]").type(newSectionName);
    cy.get("[data-cy=\"select-granularity-level\"]").select(
      sectionToCreate.granularityLevel,
    );
    cy.get("[data-cy=\"submit\"]").click();
    cy.wait("@createSection").then(({ request }) => {
      const expected = {
        name: newSectionName,
        type: SectionType.REPEATABLE,
        granularityLevel: GranularityLevel.MODEL,
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });

    cy.contains(newSectionName).should("be.visible");
  });

  it("renders draft and moves section", () => {
    const orgaId = "orgaId";

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
      {
        statusCode: 200,
        body: draft, // Mock response
      },
    ).as("getDraft");

    cy.intercept(
      "POST",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${repeatableSection.id}/move`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: [repeatableSection, section],
        },
      },
    ).as("moveSection");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.wrap(
      router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
    );
    cy.mountWithPinia(DraftView, { router });

    cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
    cy.get(`[data-cy="move-section-${repeatableSection.id}-up"]`).click();
    cy.wait("@moveSection").then(({ request }) => {
      const expected = {
        type: MoveType.POSITION,
        direction: MoveDirection.UP,
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });
  });

  it("renders draft and moves data field", () => {
    const orgaId = "orgaId";

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
      {
        statusCode: 200,
        body: draft, // Mock response
      },
    ).as("getDraft");

    const dataField1 = section.dataFields[1] as DataFieldDto;
    cy.intercept(
      "POST",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${section.id}/data-fields/${dataField1.id}/move`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: [
            {
              ...section,
              dataFields: [dataField1, section.dataFields[0]],
            },
            repeatableSection,
          ],
        },
      },
    ).as("moveDataField");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.wrap(
      router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
    );
    cy.mountWithPinia(DraftView, { router });

    cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
    cy.get(
      `[data-cy="move-data-field-${dataField1.id}-up"]`,
    ).click();
    cy.wait("@moveDataField").then(({ request }) => {
      const expected = {
        type: MoveType.POSITION,
        direction: MoveDirection.UP,
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });
  });

  it("modify and delete a section", () => {
    const orgaId = "orgaId";

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
      {
        statusCode: 200,
        body: draft, // Mock response
      },
    ).as("getDraft");

    const newSectionName = "New Name";

    cy.intercept(
      "PATCH",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${section.id}`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: [{ ...section, name: newSectionName }, repeatableSection],
        },
      },
    ).as("patchSection");

    cy.intercept(
      "DELETE",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${section.id}`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: draft.sections.filter(s => s.id !== section.id),
        },
      },
    ).as("deleteSection");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.wrap(
      router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
    );

    cy.mountWithPinia(TestWrapper, {
      slots: {
        default: DraftView,
      },
      router,
    });

    cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
    const actionsOfSection = cy.get(
      `[data-cy="actions-section-${section.id}"]`,
    );
    actionsOfSection.within(() => cy.contains("Editieren").click());

    cy.get("[data-cy=\"name\"]").clear();
    cy.get("[data-cy=\"name\"]").type(newSectionName);

    cy.get("[data-cy=\"submit\"]").click();

    cy.wait("@patchSection").then(({ request }) => {
      const expected = {
        name: newSectionName,
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });

    actionsOfSection.within(() => cy.contains("Editieren").click());

    cy.contains("Abschnitt löschen").click();
    cy.contains("button", "Bestätigen").click();
    cy.wait("@deleteSection").its("response.statusCode").should("eq", 200);
  });

  interface TestCase {
    type: DataFieldType;
    textToSelect: string;
  }

  Cypress._.forEach<TestCase>(
    [
      { type: DataFieldType.TEXT_FIELD, textToSelect: "Textfeld" },
      {
        type: DataFieldType.PRODUCT_PASSPORT_LINK,
        textToSelect: "Produktpass Verlinkung",
      },
    ],
    ({ type, textToSelect }) => {
      it(`renders draft and creates a data field of type ${type}`, () => {
        const orgaId = "orgaId";

        const dataFieldToCreate: DataFieldDto = {
          id: "dCreate1",
          type,
          name: "Processor",
          options: {},
          granularityLevel: GranularityLevel.ITEM,
        };

        cy.intercept(
          "GET",
          `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
          {
            statusCode: 200,
            body: draft,
          },
        ).as("getDraft");

        cy.intercept(
          "POST",
          `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${section.id}/data-fields`,
          {
            statusCode: 200,
            body: {
              ...draft,
              sections: [
                {
                  ...section,
                  dataFields: [...section.dataFields, dataFieldToCreate],
                },
                repeatableSection,
              ],
            }, // Mock response
          },
        ).as("createDataField");

        const indexStore = useIndexStore();
        indexStore.selectOrganization(orgaId);

        cy.wrap(
          router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
        );
        cy.mountWithPinia(DraftView, { router });

        cy.wait("@getDraft").its("response.statusCode").should("eq", 200);

        // add data field
        const actionsOfSection = cy.get(
          `[data-cy="actions-section-${section.id}"]`,
        );
        actionsOfSection.within(() =>
          cy.contains("Datenfeld hinzufügen").click(),
        );
        cy.contains("li", textToSelect).click();
        cy.get("[data-cy=\"name\"]").type(dataFieldToCreate.name);
        cy.get("[data-cy=\"select-granularity-level\"]").select(
          dataFieldToCreate.granularityLevel,
        );

        cy.get("[data-cy=\"submit\"]").click();

        cy.wait("@createDataField").then(({ request }) => {
          const expected = {
            name: dataFieldToCreate.name,
            type,
            granularityLevel: GranularityLevel.ITEM,
          };
          cy.expectDeepEqualWithDiff(request.body, expected);
        });

        cy.get(`[data-cy="${dataFieldToCreate.id}"]`)
          .find("input")
          .should("have.attr", "placeholder", dataFieldToCreate.name);
      });
    },
  );

  it("creates a sub section and data field of repeatable", () => {
    const orgaId = "orgaId";
    const newSectionName = "Sustainability";

    const sectionToCreate = {
      parentId: repeatableSection.id,
      id: "sCreate1",
      name: newSectionName,
      type: SectionType.GROUP,
      dataFields: [],
      subSections: [],
      granularityLevel: GranularityLevel.ITEM,
    };
    const newDataFieldName = "New Data Field";

    const dataFieldToCreate: DataFieldDto = {
      id: "dCreate1",
      type: DataFieldType.TEXT_FIELD,
      name: newDataFieldName,
      options: {},
      granularityLevel: GranularityLevel.ITEM,
    };

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
      {
        statusCode: 200,
        body: draft, // Mock response
      },
    ).as("getDraft");

    cy.intercept(
      "POST",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: [...draft.sections, sectionToCreate],
        },
      },
    ).as("createSection");

    cy.intercept(
      "POST",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${repeatableSection.id}/data-fields`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: [
            section,
            {
              ...repeatableSection,
              dataFields: [...repeatableSection.dataFields, dataFieldToCreate],
            },
          ],
        }, // Mock response
      },
    ).as("createDataField");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.wrap(
      router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
    );
    cy.mountWithPinia(DraftView, { router });

    cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
    let actionsOfSection = cy.get(
      `[data-cy="actions-section-${repeatableSection.id}"]`,
    );
    cy.spy(router, "push").as("pushSpy");

    actionsOfSection.within(() => cy.contains("Unterabschnitte").click());
    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `?sectionId=${repeatableSection.id}`,
    );
    cy.contains("Abschnitt hinzufügen").click();

    cy.contains("li", "Gruppierung").click();
    cy.get("[data-cy=\"name\"]").type(newSectionName);
    cy.get("[data-cy=\"select-granularity-level\"]").should("not.exist");
    cy.get("[data-cy=\"submit\"]").click();
    cy.wait("@createSection").then(({ request }) => {
      const expected = {
        name: newSectionName,
        type: sectionToCreate.type,
        granularityLevel: GranularityLevel.ITEM,
        parentSectionId: sectionToCreate.parentId,
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });
    cy.contains("Zur Startseite").click();
    actionsOfSection = cy.get(
      `[data-cy="actions-section-${repeatableSection.id}"]`,
    );
    actionsOfSection.within(() => cy.contains("Datenfeld hinzufügen").click());
    cy.contains("li", "Textfeld").click();
    cy.get("[data-cy=\"name\"]").type(newDataFieldName);
    cy.get("[data-cy=\"select-granularity-level\"]").should("not.exist");
    cy.get("[data-cy=\"submit\"]").click();
    cy.wait("@createDataField").then(({ request }) => {
      const expected = {
        name: newDataFieldName,
        type: DataFieldType.TEXT_FIELD,
        granularityLevel: GranularityLevel.ITEM,
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });
  });

  it("renders draft and modifies a data field", () => {
    const orgaId = "orgaId";
    const dataFieldToModify = section.dataFields[0] as DataFieldDto;

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
      {
        statusCode: 200,
        body: draft,
      },
    ).as("getDraft");

    cy.intercept(
      "PATCH",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${section.id}/data-fields/${dataFieldToModify.id}`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: [
            {
              ...section,
              dataFields: [...section.dataFields],
            },
          ],
        }, // Mock response
      },
    ).as("modifyDataField");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.wrap(
      router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
    );
    cy.mountWithPinia(DraftView, { router });

    cy.wait("@getDraft").its("response.statusCode").should("eq", 200);

    cy.get(`[data-cy="${dataFieldToModify.id}"]`).click();
    cy.get("[data-cy=\"select-granularity-level\"]").should("not.exist");
    const newFieldName = "New Name";
    const nameField = cy.get("[data-cy=\"name\"]");
    nameField.should("have.value", dataFieldToModify.name);
    nameField.clear();
    nameField.type(newFieldName);

    cy.get("[data-cy=\"submit\"]").click();

    cy.wait("@modifyDataField").then(({ request }) => {
      const expected = {
        name: newFieldName,
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });
  });

  it("renders draft and deletes data field", () => {
    const orgaId = "orgaId";
    const dataFieldToDelete = section.dataFields[0] as DataFieldDto;

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
      {
        statusCode: 200,
        body: draft,
      },
    ).as("getDraft");

    cy.intercept(
      "DELETE",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${section.id}/data-fields/${dataFieldToDelete.id}`,
      {
        statusCode: 200,
        body: {
          ...draft,
          sections: [
            {
              ...section,
              dataFields: section.dataFields.filter(
                df => df.id !== dataFieldToDelete.id,
              ),
            },
          ],
        },
      },
    ).as("deleteDataField");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.wrap(
      router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
    );
    cy.mountWithPinia(TestWrapper, {
      slots: {
        default: DraftView,
      },
      router,
    });

    cy.wait("@getDraft").its("response.statusCode").should("eq", 200);

    cy.get(`[data-cy="${dataFieldToDelete.id}"]`).click();
    cy.get("[data-cy=\"delete\"]").click();

    cy.contains("button", "Bestätigen").click();

    cy.wait("@deleteDataField").its("response.statusCode").should("eq", 200);
    cy.get(`[data-cy="${dataFieldToDelete.id}"]`).should("not.exist");
  });

  //
  // it("renders nested view", () => {
  //   const dataField: DataFieldDto = {
  //     id: "d1",
  //     name: "Processor",
  //     type: DataFieldType.TEXT_FIELD,
  //     options: {},
  //   };
  //
  //   const section: SectionDto = {
  //     id: "s1",
  //     name: "Sustain",
  //     type: SectionType.GROUP,
  //     dataFields: [dataField],
  //     subSections: [],
  //   };
  //
  //   const draftNested: ProductDataModelDraftDto = {
  //     id: "draftId",
  //     name: "My draft",
  //     version: "1.0.0",
  //     publications: [],
  //     sections: [section],
  //     createdByUserId: "u1",
  //     ownedByOrganizationId: "o1",
  //   };
  //   const dataFieldRef: DataFieldRefDto = {
  //     id: "dref1",
  //     type: NodeType.DATA_FIELD_REF,
  //     fieldId: dataField.id,
  //   };
  //   const gridItem1: GridItemDto = {
  //     type: NodeType.GRID_ITEM,
  //     id: "gi1",
  //     colSpan: {},
  //     rowSpan: { lg: 5 },
  //     content: dataFieldRef,
  //   };
  //   const gridItem2: GridItemDto = {
  //     type: NodeType.GRID_ITEM,
  //     id: "gi2",
  //     colSpan: { xs: 3, md: 1 },
  //   };
  //   const gridContainer: SectionGridDto = {
  //     type: NodeType.GRID_CONTAINER,
  //     id: "gc1",
  //     children: [gridItem1, gridItem2],
  //     cols: { md: 4 },
  //     sectionId: section.id,
  //   };
  //   const view: ViewDto = {
  //     id: "view1",
  //     name: "My View",
  //     version: "1.0.0",
  //     ownedByOrganizationId: "o1",
  //     createdByUserId: "u1",
  //     nodes: [gridContainer],
  //     dataModelId: "draftId",
  //   };
  //
  //   const orgaId = "orgaId";
  //
  //   cy.intercept(
  //     "GET",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
  //     {
  //       statusCode: 200,
  //       body: draftNested, // Mock response
  //     },
  //   ).as("getDraft");
  //
  //   cy.intercept(
  //     "GET",
  //     `${API_URL}/organizations/${orgaId}/views?dataModelId=${draft.id}`,
  //     {
  //       statusCode: 200,
  //       body: view, // Mock response
  //     },
  //   ).as("getView");
  //
  //   const indexStore = useIndexStore();
  //   indexStore.selectOrganization(orgaId);
  //
  //   cy.wrap(
  //     router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
  //   );
  //   cy.mountWithPinia(DraftView, { router });
  //
  //   cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
  //   cy.wait("@getView").its("response.statusCode").should("eq", 200);
  //   cy.get('[data-cy="gc1"]')
  //     .should("have.class", "grid")
  //     .and("have.class", "md:grid-cols-4");
  //   cy.get('[data-cy="gi1"]')
  //     .should("have.class", "xs:col-span-1")
  //     .and("have.class", "lg:row-span-5");
  //   cy.get('[data-cy="gi2"]')
  //     .should("have.class", "xs:col-span-3")
  //     .and("have.class", "md:col-span-1");
  //   cy.get('[data-cy="gi1"]').within(() => {
  //     // Assert that an input of type text exists
  //     cy.get('input[type="text"]').should("exist");
  //   });
  // });

  // it("renders draft and publish it", () => {
  //   const orgaId = "orgaId";
  //   cy.intercept(
  //     "GET",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
  //     {
  //       statusCode: 200,
  //       body: draft, // Mock response
  //     },
  //   ).as("getDraft");
  //
  //   cy.intercept(
  //     "POST",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/publish`,
  //     {
  //       statusCode: 200,
  //       body: draft, // Mock response
  //     },
  //   ).as("publishDraft");
  //
  //   const indexStore = useIndexStore();
  //   indexStore.selectOrganization(orgaId);
  //
  //   const notificationStore = useNotificationStore();
  //
  //   cy.spy(notificationStore, "addNotification").as("notifySpy");
  //
  //   cy.wrap(
  //     router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
  //   );
  //   cy.mountWithPinia(DraftView, { router });
  //
  //   cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
  //   cy.get('[data-cy="selectVisibility"]').click();
  //   cy.contains("für jeden sichtbar").click();
  //   cy.contains("button", "Veröffentlichen").click();
  //   cy.wait("@publishDraft").its("request.body").should("deep.equal", {
  //     visibility: VisibilityLevel.PUBLIC,
  //   });
  //
  //   cy.get("@notifySpy").should(
  //     "have.been.calledWith",
  //     "Ihr Entwurf wurde erfolgreich veröffentlicht. Sie können nun darauf basierend Modelle anlegen.",
  //     {
  //       label: "Modell anlegen",
  //       to: `/organizations/${orgaId}/models/create`,
  //     },
  //   );
  // });
  //
  //
  // it("renders draft and navigates to section edit", () => {
  //   const orgaId = "orgaId";
  //   cy.intercept(
  //     "GET",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
  //     {
  //       statusCode: 200,
  //       body: draft, // Mock response
  //     },
  //   ).as("getDraft");
  //
  //   const indexStore = useIndexStore();
  //   indexStore.selectOrganization(orgaId);
  //
  //   cy.wrap(
  //     router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
  //   );
  //   cy.mountWithPinia(DraftView, { router });
  //
  //   cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
  //   cy.get('[data-cy="editSection"]').click();
  //   cy.spy(router, "push").as("pushSpy");
  //   cy.get("@pushSpy").should(
  //     "have.been.calledWith",
  //     `/organizations/${orgaId}/data-model-drafts/${draft.id}/sections/${section.id}`,
  //   );
  // });
  //
  // it("renders draft and navigates to data field edit", () => {
  //   const orgaId = "orgaId";
  //   cy.intercept(
  //     "GET",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
  //     {
  //       statusCode: 200,
  //       body: draft, // Mock response
  //     },
  //   ).as("getDraft");
  //
  //   const indexStore = useIndexStore();
  //   indexStore.selectOrganization(orgaId);
  //
  //   cy.wrap(
  //     router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
  //   );
  //   cy.mountWithPinia(DraftView, { router });
  //
  //   cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
  //   cy.get('[data-cy="editDataField"]').click();
  //   cy.spy(router, "push").as("pushSpy");
  //   cy.get("@pushSpy").should(
  //     "have.been.calledWith",
  //     `/organizations/${orgaId}/data-model-drafts/${draft.id}/sections/${section.id}/data-fields/${section.dataFields[0].id}`,
  //   );
  // });
  //
  // it("renders draft and creates a new data field", () => {
  //   const orgaId = "orgaId";
  //   const newDataFieldName = "Mein neues Datenfeld";
  //
  //   cy.intercept(
  //     "GET",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
  //     {
  //       statusCode: 200,
  //       body: draft, // Mock response
  //     },
  //   ).as("getDraft");
  //
  //   cy.intercept(
  //     "POST",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${section.id}/data-fields`,
  //     {
  //       statusCode: 200,
  //       body: draft, // Mock response
  //     },
  //   ).as("createDataField");
  //
  //   const indexStore = useIndexStore();
  //   indexStore.selectOrganization(orgaId);
  //
  //   cy.wrap(
  //     router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
  //   );
  //   cy.mountWithPinia(DraftView, { router });
  //
  //   cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
  //   cy.contains(section.name).should("be.visible");
  //   section.dataFields.forEach((d) => {
  //     cy.contains(d.name).should("be.visible");
  //   });
  //
  //   cy.contains("button", "Datenfeld hinzufügen").click();
  //   cy.contains("li", "Textfeld").click();
  //   cy.get('[data-cy="name"]').type(newDataFieldName);
  //   cy.contains("button", "Erstellen").click();
  //   cy.wait("@createDataField").its("request.body").should("deep.equal", {
  //     name: newDataFieldName,
  //     type: DataFieldType.TEXT_FIELD,
  //   });
  // });
  //
  // it("renders draft and deletes a data field", () => {
  //   const orgaId = "orgaId";
  //   const dataFieldIdToDelete = section.dataFields[0].id;
  //   cy.intercept(
  //     "GET",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
  //     {
  //       statusCode: 200,
  //       body: draft, // Mock response
  //     },
  //   ).as("getDraft");
  //
  //   cy.intercept(
  //     "DELETE",
  //     `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}/sections/${section.id}/data-fields/${dataFieldIdToDelete}`,
  //     {
  //       statusCode: 200,
  //       body: draft, // Mock response
  //     },
  //   ).as("deleteDataField");
  //
  //   const indexStore = useIndexStore();
  //   indexStore.selectOrganization(orgaId);
  //
  //   cy.wrap(
  //     router.push(`/organizations/${orgaId}/data-model-drafts/${draft.id}`),
  //   );
  //   cy.mountWithPinia(DraftView, { router });
  //
  //   cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
  //   cy.contains(section.name).should("be.visible");
  //   section.dataFields.forEach((d) => {
  //     cy.contains(d.name).should("be.visible");
  //   });
  //   cy.get('[data-cy="deleteDataField"]').click();
  //   cy.wait("@deleteDataField").its("response.statusCode").should("eq", 200);
  // });
});
