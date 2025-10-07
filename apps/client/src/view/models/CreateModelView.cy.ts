import { createMemoryHistory, createRouter } from "vue-router";

import { API_URL, MARKETPLACE_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import CreateModelView from "./CreateModelView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<CreateModelVew />", () => {
  it("creates model with selected product data model", () => {
    const laptopModel = { name: "Laptop neu", id: "id1", version: "1.0.0" };
    const phoneModel = { name: "Handy", id: "id2", version: "1.2.0" };
    const phoneModelMarketplace = {
      name: "Handy Market",
      id: "id2",
      version: "1.2.0",
    };

    const orgaId = "orgaId";

    cy.intercept("GET", `${API_URL}/organizations/${orgaId}/templates`, {
      statusCode: 200,
      body: [laptopModel, phoneModel], // Mock response
    }).as("getTemplates");

    cy.intercept("GET", `${MARKETPLACE_URL}/templates/passports`, {
      statusCode: 200,
      body: [phoneModelMarketplace], // Mock response
    });

    const modelId = "mid1";
    cy.intercept("POST", `${API_URL}/organizations/${orgaId}/models`, {
      statusCode: 201,
      body: { id: modelId }, // Mock response
    }).as("createModel");

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/${modelId}`,
      {
        statusCode: 201,
        body: { id: modelId }, // Mock response
      },
    );

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.wrap(router.push(`/organizations/${orgaId}/models/create`));
    cy.spy(router, "push").as("pushSpy");
    cy.mountWithPinia(CreateModelView, {
      props: { organizationId: orgaId },
      router,
    });
    cy.wait("@getTemplates").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=\"name\"]").type("My first model");
    cy.get(`[data-cy="list-item-checkbox-${laptopModel.id}"]`).click();
    cy.contains("button", "Modelpass erstellen").click();
    cy.wait("@createModel").its("request.body").should("deep.equal", {
      name: "My first model",
      templateId: laptopModel.id,
    });
    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `/organizations/${orgaId}/models/${modelId}`,
    );
  });
});
