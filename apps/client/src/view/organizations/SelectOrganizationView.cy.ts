import { createMemoryHistory, createRouter } from "vue-router";

import { API_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations";
import SelectOrganizationView from "./SelectOrganizationView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<SelectOrganizationView />", () => {
  const member1 = {
    id: "member1",
    email: "m1@example.com",
  };
  const organizations = [
    {
      id: "orga1",
      name: "Meine erste Orga",
      members: [member1],
      ownedByUserId: member1.id,
      createdByUserId: member1.id,
    },
    {
      id: "orga2",
      name: "Meine zweite Orga",
      members: [member1],
      ownedByUserId: member1.id,
      createdByUserId: member1.id,
    },
  ];

  it("renders organizations and selects one", async () => {
    cy.intercept("GET", `${API_URL}/organizations`, {
      statusCode: 200,
      body: organizations, // Mock response
    }).as("getOrganizations");

    cy.wrap(router.push(`/organizations`));

    cy.mountWithPinia(SelectOrganizationView, { router });
    const organizationsStore = useOrganizationsStore();

    cy.wrap(organizationsStore.fetchOrganizations());
    cy.wrap(useIndexStore()).its("selectedOrganization").should("be.null");
    cy.wait("@getOrganizations").its("response.statusCode").should("eq", 200);
    cy.contains("Alle zugewiesenen Organisationen.").should("be.visible");
    cy.get(`[data-cy="${organizations[0].id}"]`).click();
    cy.wrap(useIndexStore())
      .its("selectedOrganization")
      .should("equal", organizations[0].id);
    cy.spy(router, "push").as("pushSpy");
    cy.get("@pushSpy").should("have.been.calledWith", "/");
  });
});
