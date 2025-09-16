import { createMemoryHistory, createRouter } from "vue-router";

import { API_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import DraftListView from "./DraftListView.vue";
import { TemplateDraftGetAllDto } from "@open-dpp/api-client";

const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe("<DraftListView />", () => {
  it("renders drafts and creates a new one", () => {
    const drafts: TemplateDraftGetAllDto[] = [
      {
        id: "draft1",
        name: "My first draft",
      },
      {
        id: "draft2",
        name: "My second draft",
      },
    ];

    const orgaId = "orgaId";

    cy.intercept("GET", `${API_URL}/organizations/${orgaId}/template-drafts`, {
      statusCode: 200,
      body: drafts, // Mock response
    }).as("getDrafts");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.wrap(router.push(`/organizations/${orgaId}/data-model-drafts`));
    cy.mountWithPinia(DraftListView, { router });

    cy.spy(router, "push").as("pushSpy");

    cy.wait("@getDrafts").its("response.statusCode").should("eq", 200);
    cy.contains("Passvorlagen Entwürfe").should("be.visible");
    cy.contains("Alle Passvorlagen Entwürfe").should("be.visible");
    drafts.forEach((d, index) => {
      const testId = `row-${index}`;
      const row = cy.get(`[data-cy="${testId}"]`);
      row.within(() => cy.contains(d.name).should("be.visible"));
      row.within(() => cy.contains("Editieren").click());
      cy.get("@pushSpy").should(
        "have.been.calledWith",
        `/organizations/${orgaId}/data-model-drafts/${d.id}`,
      );
    });
    cy.contains("Passvorlage entwerfen").click();
    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `/organizations/${orgaId}/data-model-drafts/create`,
    );
  });

  it("should fetch empty drafts on render and create first draft", () => {
    const orgaId = "orgaId";

    cy.intercept("GET", `${API_URL}/organizations/${orgaId}/template-drafts`, {
      statusCode: 200,
      body: [], // Mock response
    }).as("getDrafts");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.spy(router, "push").as("pushSpy");
    cy.wrap(router.push(`/organizations/${orgaId}/data-model-drafts`));
    cy.mountWithPinia(DraftListView, { router });

    cy.wait("@getDrafts").its("response.statusCode").should("eq", 200);
    cy.contains("Neue Passvorlage entwerfen").should("be.visible");
    cy.contains("button", "Passvorlage entwerfen").click();
    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `/organizations/${orgaId}/data-model-drafts/create`,
    );
  });
});
