import ItemListView from "./ItemListView.vue";
import { createMemoryHistory, createRouter } from "vue-router";

import { API_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import { ItemDto, ModelDto } from "@open-dpp/api-client";

const router = createRouter({
  history: createMemoryHistory(),
  routes: routes,
});

describe("<ItemListView />", () => {
  it("renders items and creates a new one", () => {
    // see: https://on.cypress.io/mounting-vue
    const data: Array<ItemDto> = [
      {
        id: "i1",
        dataValues: [],
        uniqueProductIdentifiers: [
          {
            uuid: "uuid",
            referenceId: "refId",
          },
        ],
        templateId: "",
      },
    ];
    const modelId = "someId";
    const orgaId = "orgaId";
    const modelDto: ModelDto = {
      id: modelId,
      templateId: "",
      name: "Test Model",
      dataValues: [],
      uniqueProductIdentifiers: [
        {
          uuid: "uuid",
          referenceId: "refId",
        },
      ],
      owner: "",
      description: "Description",
    };
    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/${modelId}/items`,
      {
        statusCode: 200,
        body: data, // Mock response
      },
    ).as("getData");

    cy.intercept(
      "POST",
      `${API_URL}/organizations/${orgaId}/models/${modelId}/items`,
      {
        statusCode: 201,
        body: data, // Mock response
      },
    ).as("createData");
    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/${modelId}`,
      {
        statusCode: 200,
        body: modelDto,
      },
    );

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);
    cy.wrap(router.push(`/organizations/${orgaId}/models/${modelId}/items/`));

    cy.mountWithPinia(ItemListView, { router });
    cy.wait("@getData").its("response.statusCode").should("eq", 200);
    cy.contains("Alle Pässe auf Einzelartikelebene").should("be.visible");
    cy.contains("QR-Code").should("be.visible");
    cy.contains("button", "Artikelpass hinzufügen").click();

    cy.wait("@createData").its("response.statusCode").should("eq", 201);
    cy.wait("@getData").its("response.statusCode").should("eq", 200);
  });

  it("should fetch empty items on render and create first item", async () => {
    const data: ItemDto[] = [];
    const modelId = "someId";
    const orgaId = "orgaId";
    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/${modelId}/items`,
      {
        statusCode: 200,
        body: data, // Mock response
      },
    ).as("getData");

    cy.intercept(
      "POST",
      `${API_URL}/organizations/${orgaId}/models/${modelId}/items`,
      {
        statusCode: 201,
        body: data, // Mock response
      },
    ).as("createData");

    cy.wrap(router.push(`/organizations/${orgaId}/models/${modelId}/items`));
    cy.mountWithPinia(ItemListView, { router });
    cy.wait("@getData").its("response.statusCode").should("eq", 200);
    cy.contains("Neuen Artikelpass hinzufügen").click();

    cy.wait("@createData").its("response.statusCode").should("eq", 201);
    cy.wait("@getData").its("response.statusCode").should("eq", 200);
  });
});
