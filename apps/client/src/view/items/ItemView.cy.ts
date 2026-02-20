import type {
  DataFieldDto,
  DataSectionDto,
  ItemDto,
  ProductPassportDto,
  UniqueProductIdentifierDto,
} from "@open-dpp/api-client";
import {
  DataFieldType,
  GranularityLevel,
  SectionType,
} from "@open-dpp/api-client";

import { createMemoryHistory, createRouter } from "vue-router";
import { API_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import ItemView from "./ItemView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<ItemView />", () => {
  it("renders model form and modify its data", async () => {
    const dataField1: DataFieldDto = {
      id: "f1",
      type: DataFieldType.TEXT_FIELD,
      name: "Prozessor",
      options: {
        min: 24,
      },
      granularityLevel: GranularityLevel.ITEM,
    };
    const dataField2: DataFieldDto = {
      id: "f2",
      type: DataFieldType.TEXT_FIELD,
      name: "Neuer Title 2",
      options: {
        min: 2,
      },
      granularityLevel: GranularityLevel.ITEM,
    };

    const dataField3: DataFieldDto = {
      id: "f3",
      type: DataFieldType.TEXT_FIELD,
      name: "Neuer Title 3 auf Itemebene",
      options: {
        min: 2,
      },
      granularityLevel: GranularityLevel.MODEL,
    };

    const section1: DataSectionDto = {
      id: "s1",
      type: SectionType.GROUP,
      name: "Technische Spezifikation",
      parentId: undefined,
      subSections: ["s1-1"],
      dataFields: [dataField1, dataField2, dataField3],
      dataValues: [{ f1: "val1", f2: "val2" }],
    };

    const section1OtherPassport: DataSectionDto = {
      id: "s1",
      type: SectionType.GROUP,
      name: "Technische Spezifikation",
      parentId: undefined,
      subSections: ["s1-1"],
      dataFields: [dataField1, dataField2, dataField3],
      dataValues: [{ f1: "otherVal1", f2: "otherVal2" }],
    };

    const dataField21: DataFieldDto = {
      id: "f1-1",
      type: DataFieldType.TEXT_FIELD,
      name: "Größe",
      options: {
        min: 24,
      },
      granularityLevel: GranularityLevel.ITEM,
    };

    const section2: DataSectionDto = {
      id: "s2",
      type: SectionType.REPEATABLE,
      name: "Dimensions",
      parentId: "s1",
      subSections: [],
      dataFields: [dataField21],
      granularityLevel: GranularityLevel.ITEM,
      dataValues: [],
    };

    const section3: DataSectionDto = {
      id: "s3",
      type: SectionType.REPEATABLE,
      name: "Footprints",
      subSections: [],
      dataFields: [dataField21],
      granularityLevel: GranularityLevel.MODEL,
      dataValues: [],
    };

    // see: https://on.cypress.io/mounting-vue
    const productPassport: ProductPassportDto = {
      id: "pdm1",
      name: "Laptop neu",
      description: "Laptop neu desc",
      mediaReferences: [],
      dataSections: [section1, section2, section3],
      organizationName: "Org A",
    };

    const productPassportOther: ProductPassportDto = {
      id: "pdm1other",
      name: "Laptop neu other",
      description: "Laptop neu desc",
      mediaReferences: [],
      dataSections: [section1OtherPassport, section2, section3],
      organizationName: "Org A",
    };
    const item: ItemDto = {
      dataValues: [],
      templateId: "",
      id: "someId",
      uniqueProductIdentifiers: [
        {
          uuid: "uuid",
          referenceId: "someId",
        },
      ],
    };

    const otherItem = {
      id: "otherId",
      uniqueProductIdentifiers: [
        {
          uuid: "other-uuid",
          referenceId: "otherId",
        },
      ],
    };

    const orgaId = "orga1";
    const modelId = "model1";

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/${modelId}/items/*`,
      (req) => {
        const itemId = req.url.split("/").pop();
        req.reply({
          statusCode: 200,
          body: itemId === item.id ? item : otherItem, // Mock response
        });
      },
    ).as("getItem");

    cy.intercept("GET", `${API_URL}/product-passports/*`, (req) => {
      const uuid = req.url.split("/").pop();
      const uqi = item.uniqueProductIdentifiers[0] as UniqueProductIdentifierDto;
      req.reply({
        statusCode: 200,
        body:
          uuid === uqi.uuid
            ? productPassport
            : productPassportOther, // Mock response
      });
    }).as("getProductModelData");

    cy.intercept(
      "PATCH",
      `${API_URL}/organizations/${orgaId}/models/${modelId}/items/${item.id}/data-values`,
      {
        statusCode: 200,
        body: item, // Mock response
      },
    ).as("updateData");
    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/${modelId}`,
      {
        statusCode: 200,
        body: { id: modelId },
      },
    );

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.mountWithPinia(ItemView, { router });
    cy.wrap(
      router.push(
        `/organizations/${orgaId}/models/${modelId}/items/${item.id}`,
      ),
    ).then(() => {
      cy.wait("@getItem").its("response.statusCode").should("eq", 200);
      cy.wait("@getProductModelData")
        .its("response.statusCode")
        .should("eq", 200);
      cy.contains("Artikelpass Informationen").should("be.visible");

      cy.contains("Laptop neu").should("be.visible");

      cy.get("[data-cy=\"section-card-s3\"]").within(() => {
        cy.contains("Wird auf Modelebene gesetzt").should("be.visible");
        cy.contains("Speichern").should("not.exist");
      });
      const section1Card = cy.get("[data-cy=\"section-card-s1\"]");
      section1Card.within(() => {
        cy.get("[data-cy=\"f1\"]").should("have.value", "val1");
        cy.get("[data-cy=\"f2\"]").should("have.value", "val2");
        cy.get("[data-cy=\"f3\"]").should(
          "contain.text",
          "Wird auf Modelebene gesetzt",
        );
        cy.get("[data-cy=\"f1\"]").type("add1");
        cy.get("[data-cy=\"f2\"]").type("add2");
        cy.contains("button", "Speichern").click();
      });

      cy.wait("@updateData").then((interceptor) => {
        expect(interceptor.request.body).to.deep.equal([
          {
            dataSectionId: "s1",
            dataFieldId: "f1",
            value: "val1add1",
            row: 0,
          },
          { dataSectionId: "s1", dataFieldId: "f2", value: "val2add2", row: 0 },
        ]);
        expect(interceptor.response?.statusCode).to.equal(200);
        cy.wrap(
          router.push(
            `/organizations/${orgaId}/models/${modelId}/items/${otherItem.id}`,
          ),
        ).then(() => {
          cy.wait("@getItem").its("response.statusCode").should("eq", 200);
          cy.wait("@getProductModelData")
            .its("response.statusCode")
            .should("eq", 200);
          cy.contains("other-uuid").should("be.visible");
          const section1Card = cy.get("[data-cy=\"section-card-s1\"]");
          section1Card.within(() => {
            cy.get("[data-cy=\"f1\"]").should("have.value", "otherVal1");
            cy.get("[data-cy=\"f2\"]").should("have.value", "otherVal2");
          });
        });
      });
    });
  });
});
