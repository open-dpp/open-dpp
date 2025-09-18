import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "../../router";
import Chat from "./Chat.vue";
import { MsgStatus, Sender, useAiAgentStore } from "../../stores/ai-agent";

const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe("<Chat />", () => {
  it("renders chat messages", () => {
    const aiAgentStore = useAiAgentStore();

    // Stub connect to simulate receiving a message
    aiAgentStore.connect = cy.stub().callsFake(() => {
      aiAgentStore.messages.push({
        id: 1,
        text: "Hello from ai agent",
        sender: Sender.Bot,
        status: MsgStatus.Success,
      });
    });
    cy.spy(aiAgentStore, "sendMessage").as("sendMessage");

    const permalinkId = "1234567890";
    cy.wrap(router.push(`/${permalinkId}/chat`));
    cy.mountWithPinia(Chat, { router });
    cy.contains("Hello from ai agent").should("exist");
    cy.get("#question").type("Wie viel CO2 steckt in dem Produkt?");
    cy.contains("Abschicken").click();
    cy.get("@sendMessage").should(
      "have.been.calledWith",
      "Wie viel CO2 steckt in dem Produkt?",
    );
  });
});
