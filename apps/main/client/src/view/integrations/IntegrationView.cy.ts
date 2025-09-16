import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import IntegrationView from "./IntegrationView.vue";
import { AGENT_SERVER_URL } from "../../const";

const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe("<IntegrationView />", () => {
  it("renders integrations and navigates to them", () => {
    const orgaId = "orga1";
    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.intercept(
      "GET",
      `${AGENT_SERVER_URL}/organizations/${orgaId}/configurations`,
      {
        statusCode: 404, // Mock response
      },
    ).as("getAiConfiguration");

    cy.wrap(router.push(`/organizations/${orgaId}/integrations`));
    cy.mountWithPinia(IntegrationView, { router });

    cy.contains("Alle Ihre Integrationen").should("be.visible");

    cy.wait("@getAiConfiguration").its("response.statusCode").should("eq", 404);
    cy.spy(router, "push").as("pushSpy");

    const aiIntegration = cy.get('[data-cy="row-1"]');
    aiIntegration.within(() => {
      cy.contains("KI-Integration").should("be.visible");
      cy.contains("Inaktiv").should("be.visible");
      cy.contains("Editieren").click();

      cy.get("@pushSpy").should(
        "have.been.calledWith",
        `/organizations/${orgaId}/integrations/ai-integration`,
      );
    });
    const proAlphaIntegration = cy.get('[data-cy="row-0"]');
    proAlphaIntegration.within(() => {
      cy.contains("ProAlpha Integration").should("be.visible");
      cy.contains("Editieren").click();

      cy.get("@pushSpy").should(
        "have.been.calledWith",
        `/organizations/${orgaId}/integrations/pro-alpha`,
      );
    });
  });
});
