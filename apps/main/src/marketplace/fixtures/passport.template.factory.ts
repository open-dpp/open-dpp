import { randomUUID } from "node:crypto";
import { Factory } from "fishery";
import { Sector } from "../../data-modelling/domain/sectors";
import { PassportTemplatePublicationProps } from "../domain/passport-template-publication";

export const nowDate = new Date("2025-01-01T12:00:00Z");

export const passportTemplatePublicationPropsFactory
  = Factory.define<PassportTemplatePublicationProps>(({ params }) => ({
    id: randomUUID(),
    ownedByOrganizationId: params.ownedByOrganizationId as string,
    createdByUserId: params.createdByUserId as string,
    name: "test",
    description: "test description",
    version: "1.0.0",
    isOfficial: true,
    sectors: [Sector.BATTERY],
    website: "https://open-dpp.de",
    contactEmail: "test@example.com",
    organizationName: "open-dpp",
    templateData: {
      id: randomUUID(),
      name: "my name",
      version: "1.0.0",
      createdByUserId: params.createdByUserId as string,
      ownedByOrganizationId: params.ownedByOrganizationId as string,
      sections: [],
    },
    vcDid: "did:key:z6Mkrh8ezBnQcZWXnDskt8oPHb4kGvSENgHwy8k7Vr857FqU",
    createdAt: nowDate,
    updatedAt: nowDate,
  }));
