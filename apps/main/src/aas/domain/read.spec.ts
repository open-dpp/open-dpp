import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as aas from "@aas-core-works/aas-core3.0-typescript";
import { QuantityVisitor } from "./ValueUpdateTransformer";

describe("aas", () => {
  it("should read", async () => {
    const jsonString = await readFile(join(__dirname, "./Semitrailer_Truck-environment.json"), "utf-8");
    const data = JSON.parse(jsonString);

    const instanceOrError = aas.jsonization.environmentFromJsonable(data);

    if (instanceOrError.error !== null) {
      console.log(
        "De-serialization failed: "
        + `${instanceOrError.error.path}: `
        + `${instanceOrError.error.message}`,
      );
    }

    const environment = instanceOrError.mustValue();

    // for (const submodel of environment.overSubmodelsOrEmpty()) {
    //   if (aas.types.isSubmodel(submodel)) {
    //     console.log(submodel.idShort);
    //     for (const submodelElement of submodel.overSubmodelElementsOrEmpty()) {
    //       if (aas.types.isSubmodelElement(submodelElement)) {
    //         console.log(submodelElement.idShort);
    //       }
    //     }
    //   }
    // }

    // Suppose we want to change "MotorSubmodel.TorqueProperty" to value "55"
    const visitor = new QuantityVisitor("BillOfMaterial.Semitrailer_Truck.Quantity", "900000");
    environment.acceptWithContext(visitor, []);

    await writeFile(join(__dirname, "./output.json"), JSON.stringify(aas.jsonization.toJsonable(environment)), "utf8");

    // class Visitor extends aas.types.PassThroughVisitorWithContext {
    //   visitPropertyWithContext(that: aas.types.Property, context: ContextT): void {
    //     if (aas.types.isProperty(that) && that.idShort === "Quantity") {
    //       console.log(that.idShort, that.value);
    //       that.
    //       console.log(context.);
    //     }
    //   }
    // }
    //
    // const visitor = new Visitor();
    // visitor.visitWithContext(environment);
  });
});
