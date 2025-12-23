import { Sector } from "@open-dpp/api-client";

import { createMemoryHistory, createRouter } from "vue-router";
import { API_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import CreateDraftView from "./CreateDraftView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<CreateDraftView />", () => {
  it("creates draft", () => {
    const orgaId = "orgaId";
    const createDraftDto = {
      name: "my draft",
      description: "my description",
      sectors: [Sector.BATTERY, Sector.ELECTRONICS],
    };
    const draftId = "draftId";

    cy.intercept("POST", `${API_URL}/organizations/${orgaId}/template-drafts`, {
      statusCode: 201,
      body: { id: draftId, ...createDraftDto }, // Mock response
    }).as("createDraft");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.wrap(router.push(`/organizations/${orgaId}/data-model-drafts/create`));
    cy.spy(router, "push").as("pushSpy");
    cy.mountWithPinia(CreateDraftView, {
      router,
    });
    cy.get("[data-cy=\"name\"]").type(createDraftDto.name);
    cy.get("[data-cy=\"description\"]").type(createDraftDto.description);
    const valuesToSelect = ["Batterie", "Elektronik"];

    valuesToSelect.forEach((value) => {
      cy.get("[data-cy=\"sectors\"]")
        .contains("label", value)
        .find("input[type=\"checkbox\"]")
        .check({ force: true });
    });

    cy.contains("button", "Erstellen").click();
    cy.wait("@createDraft")
      .its("request.body")
      .should("deep.equal", createDraftDto);

    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `/organizations/${orgaId}/data-model-drafts/${draftId}`,
    );
  });
});
