import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { AssetKindType } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { ConceptDescription } from "./concept-description";
import { Environment } from "./environment";
import { ExpandedEnvironment } from "./expanded-environment";
import { Submodel } from "./submodel-base/submodel";

function createSubmodel(id?: string, idShort?: string): Submodel {
  const resolvedId = id ?? randomUUID();
  return Submodel.create({ id: resolvedId, idShort: idShort ?? `submodel-${resolvedId}` });
}

function createConceptDescription(id?: string): ConceptDescription {
  return ConceptDescription.create({ id: id ?? randomUUID() });
}

function createShell(id?: string, submodels: Submodel[] = []): AssetAdministrationShell {
  const shell = AssetAdministrationShell.create({
    id: id ?? randomUUID(),
    assetInformation: AssetInformation.create({ assetKind: "Type" as AssetKindType }),
  });
  submodels.forEach((sm) => {
    shell.addSubmodel(sm);
  });
  return shell;
}

describe("expandedEnvironment", () => {
  describe("empty", () => {
    it("should create an empty expanded environment", () => {
      const env = ExpandedEnvironment.empty();
      expect(env.shells).toEqual([]);
      expect(env.submodels).toEqual([]);
      expect(env.conceptDescriptions).toEqual([]);
    });

    it("should serialize empty environment to plain", () => {
      const plain = ExpandedEnvironment.empty().toPlain();
      expect(plain).toEqual({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: [],
      });
    });
  });

  describe("fromLoaded", () => {
    it("should create from loaded domain objects", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);
      const cd = createConceptDescription("cd-1");

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], [cd]);

      expect(env.shells).toEqual([shell]);
      expect(env.submodels).toEqual([submodel]);
      expect(env.conceptDescriptions).toEqual([cd]);
    });
  });

  describe("fromEnvironment", () => {
    it("should resolve all entities from maps when all IDs exist", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);
      const cd = createConceptDescription("cd-1");
      const environment = Environment.create({
        assetAdministrationShells: [shell.id],
        submodels: [submodel.id],
        conceptDescriptions: [cd.id],
      });

      const shellMap = new Map([[shell.id, shell]]);
      const submodelMap = new Map([[submodel.id, submodel]]);
      const cdMap = new Map([[cd.id, cd]]);

      const expanded = ExpandedEnvironment.fromEnvironment(environment, shellMap, submodelMap, cdMap);

      expect(expanded.shells).toEqual([shell]);
      expect(expanded.submodels).toEqual([submodel]);
      expect(expanded.conceptDescriptions).toEqual([cd]);
    });

    it("should throw ValueError when shells are missing from map", () => {
      const environment = Environment.create({
        assetAdministrationShells: ["missing-shell-id"],
        submodels: [],
        conceptDescriptions: [],
      });

      expect(() => ExpandedEnvironment.fromEnvironment(
        environment,
        new Map(),
        new Map(),
        new Map(),
      )).toThrow(ValueError);
    });

    it("should throw ValueError when submodels are missing from map", () => {
      const environment = Environment.create({
        assetAdministrationShells: [],
        submodels: ["missing-submodel-id"],
        conceptDescriptions: [],
      });

      expect(() => ExpandedEnvironment.fromEnvironment(
        environment,
        new Map(),
        new Map(),
        new Map(),
      )).toThrow(ValueError);
    });

    it("should throw ValueError when concept descriptions are missing from map", () => {
      const environment = Environment.create({
        assetAdministrationShells: [],
        submodels: [],
        conceptDescriptions: ["missing-cd-id"],
      });

      expect(() => ExpandedEnvironment.fromEnvironment(
        environment,
        new Map(),
        new Map(),
        new Map(),
      )).toThrow(ValueError);
    });

    it("should include all missing IDs in the error message", () => {
      const environment = Environment.create({
        assetAdministrationShells: ["shell-1", "shell-2"],
        submodels: ["sub-1"],
        conceptDescriptions: ["cd-1"],
      });

      expect(() => ExpandedEnvironment.fromEnvironment(
        environment,
        new Map(),
        new Map(),
        new Map(),
      )).toThrow(
        /Missing shells: \[shell-1, shell-2\].*missing submodels: \[sub-1\].*missing concept descriptions: \[cd-1\]/,
      );
    });

    it("should succeed with empty environment", () => {
      const environment = Environment.create({});

      const expanded = ExpandedEnvironment.fromEnvironment(
        environment,
        new Map(),
        new Map(),
        new Map(),
      );

      expect(expanded.shells).toEqual([]);
      expect(expanded.submodels).toEqual([]);
      expect(expanded.conceptDescriptions).toEqual([]);
    });
  });

  describe("fromPlain", () => {
    it("should reconstruct domain objects from valid plain data", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);
      const cd = createConceptDescription("cd-1");

      const plain = {
        assetAdministrationShells: [shell.toPlain()],
        submodels: [submodel.toPlain()],
        conceptDescriptions: [cd.toPlain()],
      };

      const env = ExpandedEnvironment.fromPlain(plain);

      expect(env.shells).toHaveLength(1);
      expect(env.shells[0].id).toBe(shell.id);
      expect(env.submodels).toHaveLength(1);
      expect(env.submodels[0].id).toBe(submodel.id);
      expect(env.conceptDescriptions).toHaveLength(1);
      expect(env.conceptDescriptions[0].id).toBe("cd-1");
    });

    it("should throw ValueError for submodel with missing id", () => {
      const plain = {
        assetAdministrationShells: [],
        submodels: [{ idShort: "no-id", modelType: "Submodel" }],
        conceptDescriptions: [],
      };

      expect(() => ExpandedEnvironment.fromPlain(plain)).toThrow(
        new ValueError("Submodel at index 0 has a missing or invalid id"),
      );
    });

    it("should default conceptDescriptions to empty array when not provided", () => {
      const plain = {
        assetAdministrationShells: [],
        submodels: [],
      };

      const env = ExpandedEnvironment.fromPlain(plain);
      expect(env.conceptDescriptions).toEqual([]);
    });

    it("should throw ValueError for invalid submodel data", () => {
      const plain = {
        assetAdministrationShells: [],
        submodels: [{ id: randomUUID() }],
        conceptDescriptions: [],
      };

      expect(() => ExpandedEnvironment.fromPlain(plain)).toThrow(ValueError);
    });

    it("should throw ValueError for invalid shell data", () => {
      const plain = {
        assetAdministrationShells: [{ id: randomUUID() }],
        submodels: [],
        conceptDescriptions: [],
      };

      expect(() => ExpandedEnvironment.fromPlain(plain)).toThrow(ValueError);
    });
  });

  describe("toPlain", () => {
    it("should serialize all shells, submodels, and concept descriptions to plain objects", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);
      const cd = createConceptDescription("cd-1");

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], [cd]);
      const plain = env.toPlain();

      expect(plain.assetAdministrationShells).toHaveLength(1);
      expect(plain.assetAdministrationShells[0].id).toBe(shell.id);
      expect(plain.submodels).toHaveLength(1);
      expect(plain.submodels[0].id).toBe(submodel.id);
      expect(plain.conceptDescriptions).toHaveLength(1);
      expect(plain.conceptDescriptions[0].id).toBe("cd-1");
    });
  });

  describe("toEnvironment", () => {
    it("should produce an ID-only Environment from current shells, submodels, and concept descriptions", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);
      const cd = createConceptDescription("cd-1");

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], [cd]);
      const idEnv = env.toEnvironment();

      expect(idEnv.assetAdministrationShells).toEqual([shell.id]);
      expect(idEnv.submodels).toEqual([submodel.id]);
      expect(idEnv.conceptDescriptions).toEqual(["cd-1"]);
    });
  });
});
