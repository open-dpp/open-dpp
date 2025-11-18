import { createMemoryHistory, createRouter } from "vue-router";

import { API_URL } from "../../const";
import { routes } from "../../router";
import { useIndexStore } from "../../stores";

import { modelFactory } from "../../testing-utils/fixtures/model.factory.ts";
import ModelMediaEditView from "./ModelMediaEditView.vue";

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

describe("<ModelMediaEditView />", () => {
  it("renders media of model and modifies it", async () => {
    const mediaReference1 = "m1";
    const mediaReference2 = "m2";
    const model = modelFactory.build({
      mediaReferences: [mediaReference1],
    });
    const orgaId = "orga1";

    cy.intercept(
      "GET",
      `${API_URL}/organizations/${orgaId}/models/*`,
      {
        statusCode: 200,
        body: model,
      },
    ).as("getModel");

    const blob1 = new Blob(["data1"], { type: "application/octet-stream" });
    const mediaInfo1 = {
      id: mediaReference1,
      title: "Media m1",
      size: 5,
      mimeType: "image/jpeg",
    };

    const mediaInfo2 = {
      id: mediaReference2,
      title: "Media m2",
      size: 5,
      mimeType: "image/jpeg",
    };

    cy.intercept(
      "GET",
      `${API_URL}/media/*/info`,
      (req) => {
        const match = req.url.match(/\/media\/(.+?)\/info/);
        const mediaId = match ? match[1] : null;
        req.reply({
          statusCode: 200,
          body: mediaId === mediaReference1 ? mediaInfo1 : mediaInfo2, // Mock response
        });
      },
    ).as("getMediaInfo");

    cy.intercept(
      "GET",
      `${API_URL}/media/*/download`,
      {
        statusCode: 200,
        body: blob1,
      },
    ).as("download");

    cy.intercept(
      "GET",
      `${API_URL}/media/by-organization/${orgaId}`,
      {
        statusCode: 200,
        body: [mediaInfo1, mediaInfo2],
      },
    ).as("getMediaByOrganization");

    cy.intercept(
      "POST",
      `${API_URL}/organizations/${orgaId}/models/${model.id}/media`,
      {
        statusCode: 200,
        body: { ...model, mediaReferences: [mediaReference1, mediaReference2] },
      },
    ).as("addMediaToModel");

    cy.intercept(
      "PATCH",
      `${API_URL}/organizations/${orgaId}/models/${model.id}/media/${mediaInfo2.id}/move`,
      {
        statusCode: 200,
        body: { ...model, mediaReferences: [mediaReference2, mediaReference1] },
      },
    ).as("moveMedia");

    cy.intercept(
      "DELETE",
      `${API_URL}/organizations/${orgaId}/models/${model.id}/media/${mediaInfo2.id}`,
      {
        statusCode: 200,
        body: { ...model, mediaReferences: [mediaReference1] },
      },
    ).as("deleteMedia");

    cy.intercept(
      "PATCH",
      `${API_URL}/organizations/${orgaId}/models/${model.id}/media/${mediaInfo1.id}`,
      {
        statusCode: 200,
        body: { ...model, mediaReferences: [mediaReference2] },
      },
    ).as("modifyMedia");

    const indexStore = useIndexStore();
    indexStore.selectOrganization(orgaId);

    cy.mountWithPinia(ModelMediaEditView, { router });
    cy.wrap(router.push(`/organizations/${orgaId}/models/${model.id}/media`));
    cy.wait("@getModel").its("response.statusCode").should("eq", 200);
    cy.wait("@download").its("response.statusCode").should("eq", 200);
    cy.wait("@getMediaInfo").its("response.statusCode").should("eq", 200);

    // Add image
    cy.get("[data-cy=\"add-image\"]").click();
    cy.wait("@getMediaByOrganization").its("response.statusCode").should("eq", 200);
    cy.get(`[data-cy=\"select-media-${mediaInfo2.id}\"]`).click();
    cy.contains("Auswählen").click();
    cy.wait("@addMediaToModel").its("response.statusCode").should("eq", 200);
    const rowsSelector = ".p-datatable-tbody > tr";
    const cellSelector = "td";
    cy.get(rowsSelector).eq(0).find(cellSelector).eq(0).should("contain", "Media m1");
    cy.get(rowsSelector).eq(1).find(cellSelector).eq(0).should("contain", "Media m2");
    // Move image
    cy.get(`[data-cy=\"move-media-${mediaInfo2.id}-up\"]`).click();
    cy.wait("@moveMedia").its("response.statusCode").should("eq", 200);
    cy.get(rowsSelector).eq(0).find(cellSelector).eq(0).should("contain", "Media m2");
    cy.get(rowsSelector).eq(1).find(cellSelector).eq(0).should("contain", "Media m1");
    // Delete image
    cy.get(`[data-cy=\"delete-media-${mediaInfo2.id}\"]`).click();
    cy.wait("@deleteMedia").its("response.statusCode").should("eq", 200);
    cy.contains("Media m1").should("be.visible");
    cy.contains("Media m2").should("not.exist");
    // Edit image
    cy.get(`[data-cy=\"modify-media-${mediaInfo1.id}\"]`).click();
    cy.wait("@getMediaByOrganization").its("response.statusCode").should("eq", 200);
    cy.get(`[data-cy=\"select-media-${mediaInfo2.id}\"]`).click();
    cy.contains("Auswählen").click();
    cy.wait("@modifyMedia").its("response.statusCode").should("eq", 200);
    cy.contains("Media m2").should("be.visible");
    cy.contains("Media m1").should("not.exist");
  });
});
