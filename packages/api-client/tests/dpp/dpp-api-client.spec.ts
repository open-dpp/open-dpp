import { randomUUID } from "node:crypto";
import {
  DigitalProductDocumentStatusDto,
  InvitationStatusDto,
  SubmodelElementSchema,
  UserRoleDto,
} from "@open-dpp/dto";
import {
  propertyModificationPlainFactory,
  subjectPlainFactory,
  submodelCarbonFootprintPlainFactory,
  submodelModificationPlainFactory,
} from "@open-dpp/testing";
import { AssetAdministrationShellType, OpenDppClient } from "../../src";
import { activeOrganization, orgaInvitation, organizations } from "./handlers/organization";
import {
  aasModification,
  aasResponse,
  aasWrapperId,
  filterParams,
  paginationParams,
  propertyToAdd,
  submodelCarbonFootprintElement0,
  submodelCarbonFootprintResponse,
  submodelDesignOfProduct,
  submodelDesignOfProductElement0,
  submodelValueResponse,
} from "./handlers/aas";
import { aasPropertiesWithParent, connection, connectionList } from "./handlers/aas-integration";
import { passport1, passport2 } from "./handlers/passports";
import { template1, template2 } from "./handlers/templates";

import { server } from "./msw.server";
import { userInvitation } from "./handlers/users";
import {
  activity1,
  activity2,
  digitalProductDocumentId,
  periodParams,
} from "./handlers/digital-product-documents";

describe("apiClient", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  const baseURL = "https://api.cloud.open-dpp.de";

  describe("organizations", () => {
    it("should return organizations", async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      });
      const response = await sdk.dpp.organizations.getAll();
      expect(response.data).toEqual(organizations);
    });

    it("should return invitation", async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      });
      const response = await sdk.dpp.organizations.getInvitation(orgaInvitation.id);
      expect(response.data).toEqual(orgaInvitation);
    });
  });

  describe("users", () => {
    it("should return invitations of user", async () => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      });
      const response = await sdk.dpp.users.getInvitations({ status: InvitationStatusDto.PENDING });
      expect(response.data).toEqual([userInvitation]);
    });
  });

  describe("templates", () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    });
    sdk.setActiveOrganizationId(activeOrganization.id);
    it("should get all templates", async () => {
      const response = await sdk.dpp.templates.getAll({
        pagination: paginationParams,
        filter: filterParams,
      });
      expect(response.data.result).toEqual([template1, template2]);
    });

    it("should create template", async () => {
      const response = await sdk.dpp.templates.create({
        environment: {
          assetAdministrationShells: [{ displayName: [{ language: "en", text: "test" }] }],
        },
      });
      expect(response.data).toEqual(template1);
    });

    it("should delete template", async () => {
      const response = await sdk.dpp.templates.deleteById(template1.id);
      expect(response.status).toEqual(204);
    });

    it("should modify status of template", async () => {
      const response = await sdk.dpp.templates.modifyStatus(template1.id, {
        method: "Publish",
      });
      expect(response.data.lastStatusChange.currentStatus).toEqual(
        DigitalProductDocumentStatusDto.Published,
      );
    });
  });

  describe("passports", () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    });
    sdk.setActiveOrganizationId(activeOrganization.id);
    it("should get all passports", async () => {
      const response = await sdk.dpp.passports.getAll({
        pagination: paginationParams,
        filter: filterParams,
      });
      expect(response.data.result).toEqual([passport1, passport2]);
    });

    it("should create passport", async () => {
      let response = await sdk.dpp.passports.create({ templateId: "temp" });
      expect(response.data).toEqual(passport1);

      response = await sdk.dpp.passports.create({
        environment: {
          assetAdministrationShells: [{ displayName: [{ language: "en", text: "test" }] }],
        },
      });

      expect(response.data).toEqual(passport1);
    });

    it("should delete passport", async () => {
      const response = await sdk.dpp.passports.deleteById(passport1.id);
      expect(response.status).toEqual(204);
    });

    it("should modify status of passport", async () => {
      const response = await sdk.dpp.passports.modifyStatus(passport1.id, {
        method: "Publish",
      });
      expect(response.data.lastStatusChange.currentStatus).toEqual(
        DigitalProductDocumentStatusDto.Published,
      );
    });
  });

  describe.each(["templates", "passports"])(
    "digital product document for %s",
    (appIdentifiable) => {
      const sdk = new OpenDppClient({
        dpp: { baseURL },
      });
      it("should get activities", async () => {
        const response = await sdk.dpp[appIdentifiable].getActivities(digitalProductDocumentId, {
          pagination: paginationParams,
        });
        expect(response.data.result).toEqual(
          [activity1, activity2].map((a) => ({
            ...a,
            header: { ...a.header, createdAt: a.header.createdAt.toISOString() },
          })),
        );
      });

      it("should download activities", async () => {
        const response = await sdk.dpp[appIdentifiable].downloadActivities(
          digitalProductDocumentId,
          {
            period: periodParams,
          },
        );
        expect(JSON.stringify(response.headers)).toEqual(
          JSON.stringify({
            "content-disposition": 'attachment; filename="data.zip"',
            "content-length": "0",
            "content-type": "application/zip",
          }),
        );
      });
    },
  );

  describe.each(["templates", "passports"])("aas for %s", (appIdentifiable) => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    });

    it("should return shells", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.getShells(aasWrapperId, paginationParams);
      expect(response.data.paging_metadata.cursor).toEqual(aasResponse.id);
      expect(response.data.result).toEqual([aasResponse]);
    });

    it("should modify", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.modifyShell(
        aasWrapperId,
        btoa(aasResponse.id),
        aasModification,
      );
      expect(response.data).toEqual({
        ...aasResponse,
        displayName: aasModification.displayName,
      });
    });

    it("should return submodels", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.getSubmodels(
        aasWrapperId,
        paginationParams,
      );
      expect(response.data).toEqual([submodelCarbonFootprintResponse]);
    });
    it("should return submodel by id", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.getSubmodelById(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
      );
      expect(response.data).toEqual(submodelCarbonFootprintResponse);
    });

    it("should delete submodel by id", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.deleteSubmodelById(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
      );
      expect(response.status).toEqual(204);
    });
    it("should return submodel as value", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.getSubmodelValue(
        aasWrapperId,
        btoa(submodelDesignOfProduct.id),
      );
      expect(response.data).toEqual(submodelValueResponse);
    });
    it("should return submodel elements of submodel", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.getSubmodelElements(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
      );
      expect(response.data).toEqual(submodelCarbonFootprintResponse.submodelElements);
    });

    it("should return submodel element by id", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.getSubmodelElementById(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        submodelCarbonFootprintElement0.idShort,
      );
      expect(response.data).toEqual(submodelCarbonFootprintResponse.submodelElements[0]);
    });

    it("should delete policy by subject and object", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.deletePolicyBySubjectAndObject(
        aasWrapperId,
        {
          subject: subjectPlainFactory.build(undefined, {
            transient: { userRole: UserRoleDto.ADMIN },
          }),
          object: "section1",
        },
      );
      expect(response.status).toEqual(204);
    });

    it("should delete submodel element by id", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.deleteSubmodelElementById(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        submodelCarbonFootprintElement0.idShort,
      );
      expect(response.status).toEqual(204);
    });

    it("should return submodel element value", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.getSubmodelElementValue(
        aasWrapperId,
        btoa(submodelDesignOfProduct.id),
        submodelDesignOfProductElement0.idShort,
      );
      expect(response.data).toEqual(submodelValueResponse.Design_V01);
    });

    it("should create submodel", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.createSubmodel(
        aasWrapperId,
        submodelCarbonFootprintPlainFactory.build(),
      );
      expect(response.data).toEqual(submodelCarbonFootprintResponse);
    });

    it("should modify submodel", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.modifySubmodel(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        submodelModificationPlainFactory.build(),
      );
      expect(response.data).toEqual(submodelCarbonFootprintResponse);
    });

    it("should create submodel element", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.createSubmodelElement(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        propertyToAdd,
      );
      expect(response.data).toEqual(SubmodelElementSchema.parse(propertyToAdd));
    });

    it("should create submodel element at idShortPath", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.createSubmodelElementAtIdShortPath(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        submodelCarbonFootprintElement0.idShort,
        propertyToAdd,
      );
      expect(response.data).toEqual(SubmodelElementSchema.parse(propertyToAdd));
    });

    it("should add column to submodel element list", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.addColumnToSubmodelElementList(
        aasWrapperId,
        btoa(submodelDesignOfProduct.id),
        "Design_V01.Author.ListProp",
        propertyModificationPlainFactory.build(),
        { position: 4 },
      );
      expect(response.data).toEqual(submodelDesignOfProductElement0);
    });

    it("should modify column of submodel element list", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.modifyColumnOfSubmodelElementList(
        aasWrapperId,
        btoa(submodelDesignOfProduct.id),
        "Design_V01.Author.ListProp",
        "column1",
        propertyModificationPlainFactory.build({ idShort: "column1" }),
      );
      expect(response.data).toEqual(submodelDesignOfProductElement0);
    });

    it("should delete column from submodel element list", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.deleteColumnFromSubmodelElementList(
        aasWrapperId,
        btoa(submodelDesignOfProduct.id),
        "Design_V01.Author.ListProp",
        "column1",
      );
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(submodelDesignOfProductElement0);
    });

    it("should add row to submodel element list", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.addRowToSubmodelElementList(
        aasWrapperId,
        btoa(submodelDesignOfProduct.id),
        "Design_V01.Author.ListProp",
        { position: 4 },
      );
      expect(response.data).toEqual(submodelDesignOfProductElement0);
    });

    it("should delete row from submodel element list", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.deleteRowFromSubmodelElementList(
        aasWrapperId,
        btoa(submodelDesignOfProduct.id),
        "Design_V01.Author.ListProp",
        "row1",
      );
      expect(response.status).toEqual(200);
      expect(response.data).toEqual(submodelDesignOfProductElement0);
    });

    it("should modify submodel element", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.modifySubmodelElement(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        submodelCarbonFootprintElement0.idShort,
        propertyModificationPlainFactory.build(),
      );
      expect(response.data).toEqual(SubmodelElementSchema.parse(propertyToAdd));
    });

    it("should modify value of submodel", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.modifyValueOfSubmodel(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        { PCFCalculationMethod: "GHG" },
      );
      expect(response.data).toEqual(submodelCarbonFootprintResponse);
    });

    it("should modify value of submodel element", async () => {
      const response = await sdk.dpp[appIdentifiable].aas.modifyValueOfSubmodelElement(
        aasWrapperId,
        btoa(submodelCarbonFootprintResponse.id),
        submodelCarbonFootprintElement0.idShort,
        { PCFCalculationMethod: "GHG" },
      );
      expect(response.data).toEqual(SubmodelElementSchema.parse(propertyToAdd));
    });
  });

  describe("aas-integration", () => {
    const sdk = new OpenDppClient({
      dpp: { baseURL },
    });
    sdk.setActiveOrganizationId(activeOrganization.id);
    it("should return aas connection", async () => {
      const response = await sdk.dpp.aasIntegration.getConnection(connection.id);
      expect(response.data).toEqual({
        ...connection,
      });
    });

    it("should return all aas connections of organization", async () => {
      const response = await sdk.dpp.aasIntegration.getAllConnections();
      expect(response.data).toEqual(connectionList);
    });

    it("should create aas connection", async () => {
      const response = await sdk.dpp.aasIntegration.createConnection({
        name: "Connection 1",
        aasType: AssetAdministrationShellType.Truck,
        dataModelId: randomUUID(),
        modelId: randomUUID(),
        fieldAssignments: [
          {
            dataFieldId: randomUUID(),
            sectionId: randomUUID(),
            idShortParent: "Parent",
            idShort: "Child",
          },
        ],
      });
      expect(response.data).toEqual({
        ...connection,
      });
    });

    it("should patch aas connection", async () => {
      const response = await sdk.dpp.aasIntegration.modifyConnection(connection.id, {
        name: "Connection 2",
        modelId: randomUUID(),
        fieldAssignments: [
          {
            dataFieldId: randomUUID(),
            sectionId: randomUUID(),
            idShortParent: "Parent",
            idShort: "Child",
          },
        ],
      });
      expect(response.data).toEqual({
        ...connection,
      });
    });

    it("should return aas properties with parent for given aas type", async () => {
      const response = await sdk.dpp.aasIntegration.getPropertiesOfAas(
        AssetAdministrationShellType.Truck,
      );
      expect(response.data).toEqual(aasPropertiesWithParent);
    });
  });
});
