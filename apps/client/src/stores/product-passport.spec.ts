import { SectionType } from "@open-dpp/api-client";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import {
  dataSectionFactory,
  productPassportFactory,
} from "../testing-utils/fixtures/product-passport.factory";
import { useProductPassportStore } from "./product-passport";

describe("productPassportStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should find section", async () => {
    const dataSection1 = dataSectionFactory.build();
    const dataSection2 = dataSectionFactory.build({
      type: SectionType.REPEATABLE,
    });

    const productPassport = productPassportFactory
      .addDataSection(dataSection1)
      .addDataSection(dataSection2)
      .build();

    const productPassportStore = useProductPassportStore();
    productPassportStore.productPassport = productPassport;
    const found = productPassportStore.findSection(dataSection2.id);
    expect(found).toEqual(dataSection2);
  });
});
