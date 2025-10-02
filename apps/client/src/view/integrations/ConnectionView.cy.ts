import type {
  AasPropertyWithParentDto,
} from "@open-dpp/api-client";
import {
  GranularityLevel,
} from "@open-dpp/api-client";

import { createMemoryHistory, createRouter } from "vue-router";
import { API_URL, PRO_ALPHA_INTEGRATION_ID } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";
import {
  aasConnectionFactory,
  fieldAssignmentFactory,
} from "../../testing-utils/fixtures/aas-connection.factory";
import {
  dataFieldFactory,
  sectionFactory,
} from "../../testing-utils/fixtures/section.factory";
import { templateFactory } from "../../testing-utils/fixtures/template.factory";
import ConnectionView from "./ConnectionView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<ConnectionView />", () => {
  it("renders connection and modifies it", () => {
    const sectionId2 = "s2";
    const mockedProperties: AasPropertyWithParentDto[] = [
      {
        parentIdShort: "p1",
        property: {
          idShort: "i1",
          valueType: "xs:string",
          modelType: "Property",
        },
      },
      {
        parentIdShort: "p2",
        property: {
          idShort: "i2",
          valueType: "xs:string",
          modelType: "Property",
        },
      },
    ];

    const dataField1 = dataFieldFactory.build();
    const section1 = sectionFactory.build({
      subSections: [sectionId2],
      dataFields: [dataField1],
    });
    const dataField2 = dataFieldFactory.build();
    const section2 = sectionFactory.build({
      dataFields: [dataField2],
    });
    const dataField3 = dataFieldFactory.build();
    const dataField4 = dataFieldFactory.build();
    const dataField5 = dataFieldFactory.build({
      granularityLevel: GranularityLevel.MODEL,
    });
    const section3 = sectionFactory.build({
      id: sectionId2,
      parentId: section1.id,
      dataFields: [dataField3, dataField4, dataField5],
    });

    const template = templateFactory.build({
      sections: [section1, section2, section3],
    });

    const fieldAssignment1 = fieldAssignmentFactory.build({
      dataFieldId: dataField2.id,
      sectionId: section2.id,
      idShortParent: "p1",
      idShort: "i1",
    });

    const fieldAssignment2 = fieldAssignmentFactory.build({
      dataFieldId: dataField3.id,
      sectionId: section3.id,
      idShortParent: "p2",
      idShort: "i2",
    });

    const aasConnection = aasConnectionFactory.build({
      modelId: "modelId",
      dataModelId: template.id,
      fieldAssignments: [fieldAssignment1, fieldAssignment2],
    });

    const orgaId = "orgaId";

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/integration/aas/connections/${aasConnection.id}`,
      {
        statusCode: 200,
        body: aasConnection, // Mock response
      },
    ).as("getConnection");

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/integration/aas/${aasConnection.aasType}/properties`,
      {
        statusCode: 200,
        body: mockedProperties, // Mock response
      },
    ).as("getAasProperties");

    cy.intercept("GET", `${API_URL}/organizations/${orgaId}/models`, {
      statusCode: 200,
      body: [{ id: aasConnection.modelId, name: "Truck Modellpass 1.0.0" }], // Mock response
    }).as("getModels");

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/templates/${template.id}`,
      {
        statusCode: 200,
        body: template, // Mock response
      },
    ).as("getTemplate");

    cy.intercept(
      "PATCH",
      `${API_URL}/organizations/${orgaId}/integration/aas/connections/${aasConnection.id}`,
      {
        statusCode: 200,
        body: aasConnection, // Mock response
      },
    ).as("modifyConnection");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.wrap(
      router.push(
        `/organizations/${orgaId}/integrations/${PRO_ALPHA_INTEGRATION_ID}/connections/${aasConnection.id}`,
      ),
    ).then(() => {
      cy.mountWithPinia(ConnectionView, { router });
      cy.wait("@getModels").its("response.statusCode").should("eq", 200);

      cy.wait("@getConnection").its("response.statusCode").should("eq", 200);
      cy.wait("@getAasProperties").its("response.statusCode").should("eq", 200);
      cy.wait("@getTemplate").its("response.statusCode").should("eq", 200);
      cy.contains("Verbindungsinformationen").should("be.visible");
      cy.get("[data-cy=\"aas-select-0\"]").should("have.value", "p1/i1");
      cy.get("[data-cy=\"aas-select-1\"]").should("have.value", "p2/i2");
      cy.get("[data-cy=\"aas-select-0\"]").select("p2/i2");
      cy.get("[data-cy=\"aas-select-1\"]").select("p1/i1");
      cy.contains("Truck").should("be.visible");
      cy.contains("Truck Modellpass 1.0.0").should("be.visible");

      cy.get("[data-cy=\"dpp-select-0\"]").should(
        "have.value",
        `${section2.id}/${dataField2.id}`,
      );
      cy.get("[data-cy=\"dpp-select-1\"]").should(
        "have.value",
        `${section3.id}/${dataField3.id}`,
      );
      cy.get("[data-cy=\"dpp-select-0\"]").select(
        `${section1.id}/${dataField1.id}`,
      );
      cy.get("[data-cy=\"dpp-select-1\"]").select(
        `${section3.id}/${dataField4.id}`,
      );

      cy.contains("button", "Feldverknüpfung hinzufügen").click();
      cy.get("[data-cy=\"aas-select-2\"]").select("p1/i1");
      cy.get("[data-cy=\"dpp-select-2\"]").select(
        `${section2.id}/${dataField2.id}`,
      );

      cy.contains("button", "Speichern").click();
      cy.wait("@modifyConnection").then(({ request }) => {
        const expected = {
          name: aasConnection.name,
          modelId: aasConnection.modelId,
          fieldAssignments: [
            {
              dataFieldId: dataField1.id,
              sectionId: section1.id,
              idShortParent: "p2",
              idShort: "i2",
            },
            {
              dataFieldId: dataField4.id,
              sectionId: section3.id,
              idShortParent: "p1",
              idShort: "i1",
            },
            {
              dataFieldId: dataField2.id,
              sectionId: section2.id,
              idShortParent: "p1",
              idShort: "i1",
            },
          ],
        };
        cy.expectDeepEqualWithDiff(request.body, expected);
      });
    });

    // cy.spy(router, "push").as("pushSpy");
  });
});
