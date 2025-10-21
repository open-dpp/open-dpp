import * as aas from "@aas-core-works/aas-core3.0-typescript";

export class QuantityVisitor extends aas.types.PassThroughVisitorWithContext<string[]> {
  constructor(private targetPath: string, private newValue: string) {
    super();
  }

  visitEntityWithContext(entity: aas.types.Entity, context: string[]): void {
    const newCtx = [...context, entity.idShort ?? ""];
    for (const stmt of entity.statements ?? []) {
      stmt.acceptWithContext(this, newCtx);
    }
  }

  visitSubmodelWithContext(submodel: aas.types.Submodel, context: string[]): void {
    if (aas.types.isSubmodel(submodel)) {
    }
    const newCtx = [...context, submodel.idShort ?? ""];
    for (const elem of submodel.submodelElements ?? []) {
      elem.acceptWithContext(this, newCtx);
    }
  }

  visitPropertyWithContext(prop: aas.types.Property, context: string[]): void {
    const composed = [...context, prop.idShort ?? ""].join(".");
    if (composed === this.targetPath) {
      console.log("Found property", composed);
      console.log("Current value", prop.value);

      prop.value = this.newValue;
    }
  }
}
