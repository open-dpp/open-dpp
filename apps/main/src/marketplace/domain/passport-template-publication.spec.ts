import { expect } from "@jest/globals";
import { Sector } from "../../data-modelling/domain/sectors";
import { passportTemplatePublicationPropsFactory } from "../fixtures/passport-template-publication-props.factory";
import { PassportTemplatePublication } from "./passport-template-publication";

describe("passportTemplate", () => {
  it("is created", () => {
    const props = passportTemplatePublicationPropsFactory.build();

    const passportTemplate = PassportTemplatePublication.create(props);
    expect(passportTemplate).toBeInstanceOf(PassportTemplatePublication);
    expect(passportTemplate.id).toEqual(expect.any(String));
    expect(passportTemplate.name).toEqual("test");
    expect(passportTemplate.description).toEqual("test description");
    expect(passportTemplate.isOfficial).toEqual(true);
    expect(passportTemplate.sectors).toEqual([Sector.BATTERY]);
    expect(passportTemplate.website).toEqual("https://open-dpp.de");
    expect(passportTemplate.contactEmail).toEqual("test@example.com");
    expect(passportTemplate.organizationName).toEqual("open-dpp");
    expect(passportTemplate.templateData).toEqual(props.templateData);
    expect(passportTemplate.ownedByOrganizationId).toEqual(
      props.ownedByOrganizationId,
    );
    expect(passportTemplate.createdByUserId).toEqual(props.createdByUserId);
    expect(passportTemplate.createdAt).toBeDefined();
    expect(passportTemplate.createdAt).toBeInstanceOf(Date);
  });
  it("is loaded from database", () => {
    const props = passportTemplatePublicationPropsFactory.build();

    const passportTemplate = PassportTemplatePublication.loadFromDb(props);
    expect(passportTemplate).toBeInstanceOf(PassportTemplatePublication);
    expect(passportTemplate.id).toEqual(props.id);
    expect(passportTemplate.name).toEqual("test");
    expect(passportTemplate.description).toEqual("test description");
    expect(passportTemplate.isOfficial).toEqual(true);
    expect(passportTemplate.sectors).toEqual([Sector.BATTERY]);
    expect(passportTemplate.website).toEqual("https://open-dpp.de");
    expect(passportTemplate.contactEmail).toEqual("test@example.com");
    expect(passportTemplate.organizationName).toEqual("open-dpp");
    expect(passportTemplate.templateData).toEqual(props.templateData);
    expect(passportTemplate.ownedByOrganizationId).toEqual(
      props.ownedByOrganizationId,
    );
    expect(passportTemplate.createdByUserId).toEqual(props.createdByUserId);
  });
});
