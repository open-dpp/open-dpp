import type { OrganizationDto } from "@open-dpp/api-client";

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
  const organizations: Array<OrganizationDto> = [
    {
      id: "orga1",
      name: "Meine erste Orga",
      slug: "meine-erste-orga",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "orga2",
      name: "Meine zweite Orga",
      slug: "meine-zweite-orga",
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const organization = organizations[0] as OrganizationDto;

    cy.wrap(organizationsStore.fetchOrganizations());
    cy.wrap(useIndexStore()).its("selectedOrganization").should("be.null");
    cy.wait("@getOrganizations").its("response.statusCode").should("eq", 200);
    cy.contains("Alle zugewiesenen Organisationen.").should("be.visible");
    cy.get(`[data-cy="${organization.id}"]`).click();
    cy.wrap(useIndexStore())
      .its("selectedOrganization")
      .should("equal", organization.id);
    cy.spy(router, "push").as("pushSpy");
    cy.get("@pushSpy").should("have.been.calledWith", "/");
  });
});
