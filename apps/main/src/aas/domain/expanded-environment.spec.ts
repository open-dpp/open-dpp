import { randomUUID } from "node:crypto";
import { expect } from "@jest/globals";
import { AssetKindType, KeyTypes, ReferenceTypes } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { AssetAdministrationShell } from "./asset-adminstration-shell";
import { AssetInformation } from "./asset-information";
import { Key } from "./common/key";
import { Reference } from "./common/reference";
import { ExpandedEnvironment } from "./expanded-environment";
import { Submodel } from "./submodel-base/submodel";

function createSubmodel(id?: string, idShort?: string): Submodel {
  const resolvedId = id ?? randomUUID();
  return Submodel.create({ id: resolvedId, idShort: idShort ?? `submodel-${resolvedId}` });
}

function createShell(id?: string, submodels: Submodel[] = []): AssetAdministrationShell {
  const shell = AssetAdministrationShell.create({
    id: id ?? randomUUID(),
    assetInformation: AssetInformation.create({ assetKind: "Type" as AssetKindType }),
  });
  submodels.forEach(sm => shell.addSubmodel(sm));
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
      const conceptDescriptions = ["cd-1"];

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], conceptDescriptions);

      expect(env.shells).toEqual([shell]);
      expect(env.submodels).toEqual([submodel]);
      expect(env.conceptDescriptions).toEqual(["cd-1"]);
    });
  });

  describe("fromPlain", () => {
    it("should reconstruct domain objects from valid plain data", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);

      const plain = {
        assetAdministrationShells: [shell.toPlain()],
        submodels: [submodel.toPlain()],
        conceptDescriptions: ["cd-1"],
      };

      const env = ExpandedEnvironment.fromPlain(plain);

      expect(env.shells).toHaveLength(1);
      expect(env.shells[0].id).toBe(shell.id);
      expect(env.submodels).toHaveLength(1);
      expect(env.submodels[0].id).toBe(submodel.id);
      expect(env.conceptDescriptions).toEqual(["cd-1"]);
    });

    it("should throw ValueError for submodel with missing id", () => {
      const plain = {
        assetAdministrationShells: [],
        submodels: [{ idShort: "no-id", modelType: "Submodel" }],
        conceptDescriptions: [],
      };

      expect(() => ExpandedEnvironment.fromPlain(plain)).toThrow(ValueError);
      expect(() => ExpandedEnvironment.fromPlain(plain)).toThrow(
        "Submodel at index 0 has a missing or invalid id",
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
    it("should serialize all shells and submodels to plain objects", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], ["cd-1"]);
      const plain = env.toPlain();

      expect(plain.assetAdministrationShells).toHaveLength(1);
      expect(plain.assetAdministrationShells[0].id).toBe(shell.id);
      expect(plain.submodels).toHaveLength(1);
      expect(plain.submodels[0].id).toBe(submodel.id);
      expect(plain.conceptDescriptions).toEqual(["cd-1"]);
    });
  });

  describe("toEnvironment", () => {
    it("should produce an ID-only Environment from current shells and submodels", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], ["cd-1"]);
      const idEnv = env.toEnvironment();

      expect(idEnv.assetAdministrationShells).toEqual([shell.id]);
      expect(idEnv.submodels).toEqual([submodel.id]);
      expect(idEnv.conceptDescriptions).toEqual(["cd-1"]);
    });
  });

  describe("copyWithNewIds", () => {
    it("should produce new IDs for all shells and submodels", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], []);
      const result = env.copyWithNewIds();

      expect(result.submodels).toHaveLength(1);
      expect(result.submodels[0].id).not.toBe(submodel.id);

      expect(result.shells).toHaveLength(1);
      expect(result.shells[0].id).not.toBe(shell.id);
    });

    it("should remap submodel references in copied shells to new submodel IDs", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], []);
      const result = env.copyWithNewIds();

      const newShell = result.shells[0];
      const newSubmodel = result.submodels[0];

      expect(newShell.submodels).toHaveLength(1);
      const refKey = newShell.submodels[0].keys.find(k => k.type === "Submodel");
      expect(refKey).toBeDefined();
      expect(refKey!.value).toBe(newSubmodel.id);
    });

    it("should produce a valid Environment with the new IDs", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], ["cd-1"]);
      const result = env.copyWithNewIds();

      expect(result.environment.assetAdministrationShells).toEqual([result.shells[0].id]);
      expect(result.environment.submodels).toEqual([result.submodels[0].id]);
      expect(result.environment.conceptDescriptions).toEqual(["cd-1"]);
    });

    it("should handle multiple shells and submodels", () => {
      const sub1 = createSubmodel();
      const sub2 = createSubmodel();
      const shell1 = createShell(undefined, [sub1]);
      const shell2 = createShell(undefined, [sub2]);

      const env = ExpandedEnvironment.fromLoaded([shell1, shell2], [sub1, sub2], []);
      const result = env.copyWithNewIds();

      expect(result.shells).toHaveLength(2);
      expect(result.submodels).toHaveLength(2);

      const allNewSubIds = result.submodels.map(s => s.id);
      expect(allNewSubIds).not.toContain(sub1.id);
      expect(allNewSubIds).not.toContain(sub2.id);

      for (const newShell of result.shells) {
        for (const ref of newShell.submodels) {
          const key = ref.keys.find(k => k.type === "Submodel");
          if (key) {
            expect(allNewSubIds).toContain(key.value);
          }
        }
      }
    });

    it("should handle shell with multiple submodel references", () => {
      const sub1 = createSubmodel();
      const sub2 = createSubmodel();
      const shell = createShell(undefined, [sub1, sub2]);

      const env = ExpandedEnvironment.fromLoaded([shell], [sub1, sub2], []);
      const result = env.copyWithNewIds();

      expect(result.shells[0].submodels).toHaveLength(2);
      const refValues = result.shells[0].submodels.map(
        ref => ref.keys.find(k => k.type === "Submodel")!.value,
      );
      expect(refValues).toContain(result.submodels[0].id);
      expect(refValues).toContain(result.submodels[1].id);
    });

    it("should skip unresolvable submodel references gracefully", () => {
      const submodel = createSubmodel();
      const shell = AssetAdministrationShell.create({
        assetInformation: AssetInformation.create({ assetKind: "Type" as AssetKindType }),
        submodels: [
          Reference.create({
            type: ReferenceTypes.ModelReference,
            keys: [Key.create({ type: KeyTypes.Submodel, value: "nonexistent-id" })],
          }),
        ],
      });

      const env = ExpandedEnvironment.fromLoaded([shell], [submodel], []);
      const result = env.copyWithNewIds();

      expect(result.shells[0].submodels).toHaveLength(0);
    });

    it("should handle empty environment", () => {
      const result = ExpandedEnvironment.empty().copyWithNewIds();

      expect(result.shells).toEqual([]);
      expect(result.submodels).toEqual([]);
      expect(result.environment.assetAdministrationShells).toEqual([]);
      expect(result.environment.submodels).toEqual([]);
    });

    it("should roundtrip: fromPlain -> copyWithNewIds produces valid result", () => {
      const submodel = createSubmodel();
      const shell = createShell(undefined, [submodel]);

      const plain = {
        assetAdministrationShells: [shell.toPlain()],
        submodels: [submodel.toPlain()],
        conceptDescriptions: [],
      };

      const env = ExpandedEnvironment.fromPlain(plain);
      const result = env.copyWithNewIds();

      expect(result.shells).toHaveLength(1);
      expect(result.submodels).toHaveLength(1);
      expect(result.shells[0].id).not.toBe(shell.id);
      expect(result.submodels[0].id).not.toBe(submodel.id);
    });
  });
});
