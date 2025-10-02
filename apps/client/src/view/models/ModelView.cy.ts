import type {
  DataFieldDto,
  DataSectionDto,
  ProductPassportDto,
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
import {
  dataFieldFactory,
  dataSectionFactory,
  productPassportFactory,
} from "../../testing-utils/fixtures/product-passport.factory";
import ModelView from "./ModelView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<ModelView />", () => {
  it("renders model form and modify its data", () => {
    const dataField1 = dataFieldFactory.build({ id: "f1" });
    const dataField2 = dataFieldFactory.build({
      id: "f2",
      type: DataFieldType.PRODUCT_PASSPORT_LINK,
    });
    const dataField3: DataFieldDto = dataFieldFactory.build({
      id: "f3",
      granularityLevel: GranularityLevel.ITEM,
    });
    const uuidToOtherPassport = "uuid1";

    const section1 = dataSectionFactory
      .addDataField(dataField1)
      .addDataField(dataField2)
      .addDataField(dataField3)
      .addDataValue(dataField1.id, "val1")
      .addDataValue(dataField2.id, uuidToOtherPassport)
      .build({ id: "s1", subSections: ["s1-1"] });

    const section1OtherPassport = dataSectionFactory
      .addDataField(dataField1)
      .addDataField(dataField2)
      .addDataField(dataField3)
      .addDataValue(dataField1.id, "otherVal1")
      .addDataValue(dataField2.id, uuidToOtherPassport)
      .build({ id: "s1", subSections: ["s1-1"] });

    const dataField21: DataFieldDto = dataFieldFactory.build({ id: "f1-1" });

    const section2: DataSectionDto = dataSectionFactory
      .addDataField(dataField21)
      .build({ id: "s2", parentId: "s1" });
    const dataField31: DataFieldDto = dataFieldFactory.build({ id: "f3-1" });

    const section3: DataSectionDto = dataSectionFactory
      .addDataField(dataField31)
      .build({
        id: "s3",
        granularityLevel: GranularityLevel.ITEM,
      });

    // see: https://on.cypress.io/mounting-vue
    const productPassportDto: ProductPassportDto = productPassportFactory
      .addDataSection(section1)
      .addDataSection(section2)
      .addDataSection(section3)
      .build({ name: "Laptop neu" });

    const otherProductPassportDto: ProductPassportDto = productPassportFactory
      .addDataSection(section1OtherPassport)
      .addDataSection(section2)
      .addDataSection(section3)
      .build({ name: "Other laptop" });

    const model = {
      id: "someId",
      uniqueProductIdentifiers: [
        {
          uuid: "own-uuid",
          referenceId: "someId",
        },
      ],
    };

    const otherModel = {
      id: "otherId",
      uniqueProductIdentifiers: [
        {
          uuid: "other-uuid",
          referenceId: "otherId",
        },
      ],
    };

    const orgaId = "orga1";

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/*`,
      (req) => {
        const modelId = req.url.split("/").pop();
        req.reply({
          statusCode: 200,
          body: modelId === model.id ? model : otherModel, // Mock response
        });
      },
    ).as("getModel");

    cy.intercept("GET", `${API_URL}/product-passports/*`, (req) => {
      const uuid = req.url.split("/").pop();
      req.reply({
        statusCode: 200,
        body:
          uuid === model.uniqueProductIdentifiers[0].uuid
            ? productPassportDto
            : otherProductPassportDto,
      }); // Mock response
    }).as("getTemplate");

    cy.intercept(
      "PATCH",
      `${API_URL}/organizations/${orgaId}/models/${model.id}/data-values`,
      {
        statusCode: 200,
        body: model, // Mock response
      },
    ).as("updateData");

    const refernceMock = {
      id: "ref1",
      modelId: "modelId",
      organizationId: orgaId,
      granularityLevel: GranularityLevel.ITEM,
    };

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/unique-product-identifiers/${uuidToOtherPassport}/reference`,
      {
        statusCode: 200,
        body: refernceMock, // Mock response
      },
    ).as("getUniqueProductIdentifierReference");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.mountWithPinia(ModelView, { router });

    cy.wrap(router.push(`/organizations/${orgaId}/models/${model.id}`));

    cy.wait("@getModel").its("response.statusCode").should("eq", 200);
    cy.wait("@getTemplate").its("response.statusCode").should("eq", 200);
    cy.contains("Modellpass Informationen").should("be.visible");
    cy.contains("own-uuid").should("be.visible");
    cy.get("[data-cy=\"section-card-s3\"]").within(() => {
      cy.contains("Wird auf Artikelebene gesetzt").should("be.visible");
      cy.contains("Speichern").should("not.exist");
    });
    const section1Card = cy.get("[data-cy=\"section-card-s1\"]");
    section1Card.within(() => {
      cy.get("[data-cy=\"f1\"]").should("have.value", "val1");
      cy.get("[data-cy=\"f2\"]").should("have.value", uuidToOtherPassport);
      cy.get("[data-cy=\"f3\"]").should(
        "contain.text",
        "Wird auf Artikelebene gesetzt",
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
        { dataSectionId: "s1", dataFieldId: "f2", value: "uuid1add2", row: 0 },
      ]);
      expect(interceptor.response?.statusCode).to.equal(200);
      cy.wrap(
        router.push(`/organizations/${orgaId}/models/${otherModel.id}`),
      ).then(() => {
        cy.wait("@getModel").its("response.statusCode").should("eq", 200);
        cy.wait("@getTemplate").its("response.statusCode").should("eq", 200);
        let section1Card = cy.get("[data-cy=\"section-card-s1\"]");
        section1Card.within(() => {
          cy.get("[data-cy=\"f1\"]").should("have.value", "otherVal1");
          cy.get("[data-cy=\"f2\"]").should("have.value", uuidToOtherPassport);
        });
        cy.spy(router, "push").as("pushSpy");
        cy.contains("other-uuid").should("be.visible");
        section1Card = cy.get("[data-cy=\"section-card-s1\"]");
        section1Card.within(() => {
          cy.get("[data-cy=\"Visit f2\"]").click();
        });
        cy.wait("@getUniqueProductIdentifierReference")
          .its("response.statusCode")
          .should("eq", 200);
        cy.get("@pushSpy").should(
          "have.been.calledWith",
          `/organizations/${orgaId}/models/${refernceMock.modelId}/items/${refernceMock.id}`,
        );
      });
    });
  });

  it("renders model form and navigates between different rows", () => {
    const dataField1 = dataFieldFactory.build();
    const dataField2 = dataFieldFactory.build({
      type: DataFieldType.PRODUCT_PASSPORT_LINK,
    });
    const dataSection1 = dataSectionFactory
      .addDataField(dataField1)
      .addDataField(dataField2)
      .addDataValue(dataField1.id, "f1 value")
      .addDataValue(dataField2.id, "f2 value")
      .addDataValue(dataField1.id, "f1 value, row 1", 1)
      .addDataValue(dataField2.id, "f2 value, row 1", 1)
      .build();

    const dataField3 = dataFieldFactory.build();
    const dataField4 = dataFieldFactory.build();
    const dataSection2 = dataSectionFactory
      .addDataField(dataField3)
      .addDataField(dataField4)
      .addDataValue(dataField3.id, "f3 value")
      .addDataValue(dataField4.id, "f4 value")
      .addDataValue(dataField3.id, "f3 value, row 1", 1)
      .addDataValue(dataField4.id, "f4 value, row 1", 1)
      .build({ type: SectionType.REPEATABLE });

    const dataField5 = dataFieldFactory.build();
    const dataField6 = dataFieldFactory.build();

    const dataSection3 = dataSectionFactory
      .addDataField(dataField5)
      .addDataField(dataField6)
      .addDataValue(dataField5.id, "f5 value")
      .addDataValue(dataField6.id, "f6 value")
      .addDataValue(dataField5.id, "f5 value, row 1", 1)
      .addDataValue(dataField6.id, "f6 value, row 1", 1)
      .build();

    const dataField7 = dataFieldFactory.build();
    const dataField8 = dataFieldFactory.build();

    const dataSection4 = dataSectionFactory
      .addDataField(dataField7)
      .addDataField(dataField8)
      .addDataValue(dataField7.id, "f7 value")
      .addDataValue(dataField8.id, "f8 value")
      .addDataValue(dataField7.id, "f7 value, row 1", 1)
      .addDataValue(dataField8.id, "f8 value, row 1", 1)
      .build();

    const productPassport = productPassportFactory
      .addDataSection(dataSection1)
      .addDataSection(dataSection2)
      .addDataSection(dataSection3, dataSection2.id)
      .addDataSection(dataSection4, dataSection1.id)
      .build();

    const model = {
      id: "someId",
      uniqueProductIdentifiers: [
        {
          uuid: "own-uuid",
          referenceId: "someId",
        },
      ],
    };

    const orgaId = "orga1";

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/${model.id}`,
      {
        statusCode: 200,
        body: model,
      },
    ).as("getModel");

    cy.intercept(
      "GET",
      `${API_URL}/product-passports/${model.uniqueProductIdentifiers[0].uuid}`,
      {
        statusCode: 200,
        body: productPassport,
      },
    ).as("getProductPassport");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.mountWithPinia(ModelView, { router });

    cy.wrap(router.push(`/organizations/${orgaId}/models/${model.id}`));

    cy.wait("@getModel").its("response.statusCode").should("eq", 200);
    cy.wait("@getProductPassport").its("response.statusCode").should("eq", 200);
    cy.contains("Modellpass Informationen").should("be.visible");
    cy.spy(router, "push").as("pushSpy");
    const section1Card = cy.get(`[data-cy="section-card-${dataSection1.id}"]`);
    section1Card.within(() => {
      cy.get(`[data-cy="edit-subsection-${dataSection4.id}"]`).click();
    });
    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `?sectionId=${dataSection4.id}&row=0`,
    );
    cy.contains(dataSection4.name).should("be.visible");
    cy.get(`[data-cy="${dataField7.id}"]`).should("have.value", "f7 value");
    cy.get(`[data-cy="${dataField8.id}"]`).should("have.value", "f8 value");
    cy.contains(`Zurück zu ${dataSection1.name}`).click();
    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `?sectionId=${dataSection1.id}&row=0`,
    );
    cy.contains(`Zur Startseite`).click();
    cy.get("@pushSpy").should("have.been.calledWith", `?sectionId=undefined`);
    const section2Card = cy.get(`[data-cy="section-card-${dataSection2.id}"]`);
    section2Card.within(() => {
      cy.get(`[data-cy="row-1"]`).within(() => {
        cy.contains("Editieren").click();
      });
    });
    cy.get(`[data-cy="${dataField3.id}"]`).should(
      "have.value",
      "f3 value, row 1",
    );
    cy.get(`[data-cy="${dataField4.id}"]`).should(
      "have.value",
      "f4 value, row 1",
    );
    cy.get(`[data-cy="edit-subsection-${dataSection3.id}"]`).click();
    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `?sectionId=${dataSection3.id}&row=1`,
    );
    cy.get(`[data-cy="${dataField5.id}"]`).should(
      "have.value",
      "f5 value, row 1",
    );
    cy.get(`[data-cy="${dataField5.id}"]`).should(
      "have.value",
      "f5 value, row 1",
    );
    cy.contains(`Zurück zu ${dataSection2.name}`).click();
    cy.get("@pushSpy").should(
      "have.been.calledWith",
      `?sectionId=${dataSection2.id}&row=1`,
    );
    cy.contains(`Zur Startseite`).click();
    cy.get("@pushSpy").should("have.been.calledWith", `?sectionId=undefined`);
  });
});
