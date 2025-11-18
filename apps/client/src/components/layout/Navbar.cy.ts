import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "../../router";
import Navbar from "./Navbar.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<Chat />", () => {
  it("renders chat messages", () => {
    const permalinkId = "1234567890";
    cy.wrap(router.push(`/presentation/${permalinkId}`));
    cy.mountWithPinia(Navbar, { router });
    cy.spy(router, "push").as("pushSpy");
    cy.get(".p-menubar-button").click();
    cy.contains("Mit KI chatten").click();
    cy.get("@pushSpy").should("have.been.calledWith", `/presentation/${permalinkId}/chat`);
    cy.get(".p-menubar-button").click();
    cy.contains("Zur Passansicht").click();
    cy.get("@pushSpy").should("have.been.calledWith", `/presentation/${permalinkId}`);
  });
});
