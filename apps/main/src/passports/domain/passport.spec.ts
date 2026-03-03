import { randomUUID } from "node:crypto";
import { AssetKindType, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "../../aas/domain/asset-adminstration-shell";
import { AssetInformation } from "../../aas/domain/asset-information";
import { Key } from "../../aas/domain/common/key";
import { Reference } from "../../aas/domain/common/reference";
import { Environment } from "../../aas/domain/environment";
import { ExpandedEnvironment } from "../../aas/domain/expanded-environment";
import { Submodel } from "../../aas/domain/submodel-base/submodel";
import { Passport } from "./passport";

describe("passport", () => {
  describe("toExportPlain", () => {
    it("should return expanded environment when passport has an environment", async () => {
      const aasId = randomUUID();
      const submodelId = randomUUID();

      const passport = Passport.create({
        organizationId: "org-1",
        environment: Environment.create({
          assetAdministrationShells: [aasId],
          submodels: [submodelId],
          conceptDescriptions: [],
        }),
      });

      const aas = AssetAdministrationShell.create({
        id: aasId,
        assetInformation: AssetInformation.create({ assetKind: "Type" as AssetKindType }),
        submodels: [],
      });

      const submodel = Submodel.create({
        id: submodelId,
        idShort: "testSubmodel",
      });

      const expandedEnv = ExpandedEnvironment.fromLoaded([aas], [submodel], []);

      const result = passport.toExportPlain(expandedEnv);

      expect(result.id).toBe(passport.id);
      expect(result.environment.submodels).toHaveLength(1);
      expect(result.environment.submodels[0].id).toBe(submodelId);
    });
  });

  describe("importFromPlain", () => {
    const aasId = randomUUID();
    const submodelId = randomUUID();

    function createValidExportData(
      overrides?: Partial<any>,
    ): any {
      const aasData = AssetAdministrationShell.create({
        id: aasId,
        assetInformation: AssetInformation.create({ assetKind: "Type" as AssetKindType }),
        submodels: [
          Reference.create({
            type: ReferenceTypes.ModelReference,
            keys: [Key.create({ type: KeyTypes.Submodel, value: submodelId })],
          }),
        ],
      }).toPlain();

      const submodelData = Submodel.create({
        id: submodelId,
        idShort: "testSubmodel",
      }).toPlain();

      return {
        id: randomUUID(),
        organizationId: "old-org",
        templateId: null,
        environment: {
          assetAdministrationShells: [aasData],
          submodels: [submodelData],
          conceptDescriptions: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    it("should create a new passport with fresh IDs", () => {
      const data = createValidExportData();
      const { entity, shells, submodels } = Passport.importFromPlain(data, "new-org");

      expect(entity.id).not.toBe(data.id);
      expect(entity.organizationId).toBe("new-org");
      expect(shells).toHaveLength(1);
      expect(submodels).toHaveLength(1);
      expect(entity.environment.assetAdministrationShells).toHaveLength(1);
      expect(entity.environment.submodels).toHaveLength(1);
    });

    it("should generate fresh IDs for shells and submodels", () => {
      const data = createValidExportData();
      const { shells, submodels } = Passport.importFromPlain(data, "new-org");

      expect(shells[0].id).not.toBe(aasId);
      expect(submodels[0].id).not.toBe(submodelId);
    });

    it("should propagate templateId to the new passport", () => {
      const templateId = randomUUID();
      const data = createValidExportData({ templateId });
      const { entity } = Passport.importFromPlain(data, "new-org");

      expect(entity.templateId).toBe(templateId);
    });

    it("should default templateId to null when set to null", () => {
      const data = createValidExportData({ templateId: null });
      const { entity } = Passport.importFromPlain(data, "new-org");

      expect(entity.templateId).toBeNull();
    });

    it("should default templateId to null when omitted entirely", () => {
      const { templateId: _, ...dataWithoutTemplateId } = createValidExportData();
      const { entity } = Passport.importFromPlain(dataWithoutTemplateId, "new-org");

      expect(entity.templateId).toBeNull();
    });

    it("should preserve createdAt and updatedAt from import data", () => {
      const createdAt = new Date("2024-01-01T00:00:00.000Z");
      const updatedAt = new Date("2024-06-15T12:00:00.000Z");
      const data = createValidExportData({ createdAt, updatedAt });

      const { entity } = Passport.importFromPlain(data, "new-org");

      expect(entity.createdAt).toEqual(createdAt);
      expect(entity.updatedAt).toEqual(updatedAt);
    });

    it("should throw ValueError for invalid environment data", () => {
      const invalidData = {
        id: randomUUID(),
        organizationId: "org-1",
        templateId: null,
        environment: "not-valid",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as any;

      expect(() => Passport.importFromPlain(invalidData, "org-1")).toThrow(ValueError);
    });
  });
});
