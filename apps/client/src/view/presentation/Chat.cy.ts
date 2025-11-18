import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "../../router";
import Chat from "./Chat.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<Chat />", () => {
  it("renders and allows sending messages", () => {
    const permalinkId = "1234567890";
    cy.wrap(router.push(`/${permalinkId}/chat`));

    cy.mountWithPinia(Chat, { router });

    // Verify the chat interface renders
    cy.get("#question").should("exist");
    cy.contains("Senden").should("exist");

    // Type and send a message
    cy.get("#question").type("Wie viel CO2 steckt in dem Produkt?");
    cy.contains("Senden").click();

    // Verify the input is cleared after sending (common behavior)
    cy.get("#question").should("have.value", "");

    // Verify the sent message appears in the chat
    cy.contains("Wie viel CO2 steckt in dem Produkt?").should("exist");
  });
});
