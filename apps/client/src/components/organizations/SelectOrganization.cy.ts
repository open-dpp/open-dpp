import { createMemoryHistory, createRouter } from "vue-router";

import { API_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import { useOrganizationsStore } from "../../stores/organizations";
import SelectOrganization from "./SelectOrganization.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
describe("<SelectOrganization />", () => {
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
    const indexStore = useIndexStore();
    indexStore.selectOrganization(organizations[0].id);

    cy.mountWithPinia(SelectOrganization, { router });
    const organizationsStore = useOrganizationsStore();

    cy.wrap(organizationsStore.fetchOrganizations());
    cy.contains(organizations[0].name).should("be.visible");
    cy.wait("@getOrganizations").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=\"organizationSelect\"]").click();
    cy.get("[data-cy=\"orga2\"]").click();
    cy.spy(router, "push").as("pushSpy");

    cy.get("@pushSpy").should("have.been.calledWith", "/");
  });
});
