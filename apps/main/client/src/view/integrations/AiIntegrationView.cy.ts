import { createMemoryHistory, createRouter } from "vue-router";

import { AGENT_SERVER_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import { AiProvider } from "@open-dpp/api-client";
import AiIntegrationView from "./AiIntegrationView.vue";
import { aiConfigurationFactory } from "../../testing-utils/fixtures/ai-configuration.factory";

const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe("<AiIntegrationView />", () => {
  it("create ai configuration", () => {
    const aiConfiguration = aiConfigurationFactory.build();

    const orgaId = "orgaId";

    cy.intercept(
      "GET",
      `${AGENT_SERVER_URL}/organizations/${orgaId}/configurations`,
      {
        statusCode: 200,
        body: aiConfiguration, // Mock response
      },
    ).as("getAiConfiguration");

    cy.intercept(
      "PUT",
      `${AGENT_SERVER_URL}/organizations/${orgaId}/configurations`,
      {
        statusCode: 200,
        body: { ...aiConfiguration, isEnabled: false }, // Mock response
      },
    ).as("upsertAiConfiguration");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.wrap(
      router.push(`/organizations/${orgaId}/integrations/ai-integration`),
    );
    cy.mountWithPinia(AiIntegrationView, {
      router,
    });
    cy.contains("KI Konfiguration").should("be.visible");
    cy.wait("@getAiConfiguration").its("response.statusCode").should("eq", 200);
    cy.get('input[type="checkbox"]').should("be.checked");
    cy.get('input[type="checkbox"]').uncheck({ force: true });

    cy.contains("button", "Speichern").click();

    cy.wait("@upsertAiConfiguration").then(({ request }) => {
      const expected = {
        provider: AiProvider.Mistral,
        model: "codestral-latest",
        isEnabled: false,
      };
      cy.expectDeepEqualWithDiff(request.body, expected);
    });
  });
});
