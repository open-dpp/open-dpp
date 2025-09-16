import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import Layout from "./Layout.vue";
import { API_URL } from "../../const";
import {
  DataFieldType,
  GranularityLevel,
  SectionType,
  Sector,
  TemplateDraftDto,
} from "@open-dpp/api-client";

const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe("<Layout />", () => {
  it("should render sidebar and route to correct view", () => {
    const orgaId = "orgaI";

    cy.intercept("GET", `${API_URL}/organizations/${orgaId}/models`, {
      statusCode: 200,
      body: [], // Mock response
    });

    const section = {
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
      ],
      subSections: [],
    };

    const draft: TemplateDraftDto = {
      id: "draftId",
      name: "My draft",
      description: "desc",
      sectors: [Sector.TRADE],
      version: "1.0.0",
      publications: [],
      sections: [section],
      createdByUserId: "u1",
      ownedByOrganizationId: "u2",
    };

    cy.intercept("GET", `${API_URL}/organizations/${orgaId}/template-drafts`, {
      statusCode: 200,
      body: [{ id: draft.id, name: draft.name }], // Mock response
    }).as("getDrafts");

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/template-drafts/${draft.id}`,
      {
        statusCode: 200,
        body: draft, // Mock response
      },
    ).as("getDraft");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    // cy.wrap(router.push(`/organizations/${orgaId}/models/create`));
    cy.spy(router, "push").as("pushSpy");
    cy.mountWithPinia(Layout, {
      router,
    });
    cy.get('[data-cy="openSidebar"]').click();
    cy.get('[data-cy="sidebar"]').within(() => {
      cy.contains("Passvorlagen Entwürfe").click();
      cy.get("@pushSpy").should(
        "have.been.calledWith",
        `/organizations/${orgaId}/data-model-drafts`,
      );
      cy.wait("@getDrafts").its("response.statusCode").should("eq", 200);
    });
    cy.get('[data-cy="closeSidebar"]').click();
    cy.contains("Editieren").click();
    cy.wait("@getDraft").its("response.statusCode").should("eq", 200);
  });
});
