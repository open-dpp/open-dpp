import { Sector } from "@open-dpp/api-client";
import { sectionBaseDocumentation } from "./section-base.doc";

export const templateDocumentation = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    name: {
      type: "string",
      minLength: 1,
    },
    description: {
      type: "string",
    },
    sectors: {
      type: "array",
      items: {
        type: "string",
        enum: Object.values(Sector),
      },
      description: "The sectors which the template is applicable to.",
    },
    version: {
      type: "string",
      minLength: 1,
    },
    sections: {
      type: "array",
      items: { ...sectionBaseDocumentation },
    },
    createdByUserId: {
      type: "string",
      format: "uuid",
    },
    ownedByOrganizationId: {
      type: "string",
      format: "uuid",
    },
    marketplaceResourceId: {
      type: "string",
      format: "uuid",
      nullable: true,
    },
  },
  required: [
    "id",
    "name",
    "description",
    "version",
    "sections",
    "createdByUserId",
    "ownedByOrganizationId",
  ],
};

export const templateGetAllDocumentation = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
    },
    name: {
      type: "string",
    },
    version: { type: "string", minLength: 1 },
    description: { type: "string" },
    sectors: {
      type: "array",
      items: {
        type: "string",
        enum: Object.values(Sector),
      },
      description: "The sectors which the template is applicable to.",
    },
  },
};
