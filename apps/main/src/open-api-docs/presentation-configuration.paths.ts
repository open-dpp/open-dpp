import {
  PresentationConfigurationCreateRequestSchema,
  PresentationConfigurationDtoSchema,
  PresentationConfigurationListResponseSchema,
  PresentationConfigurationPatchSchema,
} from "@open-dpp/dto";
import { IdParamSchema } from "../aas/presentation/aas.decorators";
import { ContentType } from "./content.types";
import { HTTPCode } from "./http.codes";
import { z } from "zod";

const security = [{ apiKeyAuth: [] }];
const orgaIdHeader = { $ref: "#/components/parameters/OrganizationIdHeader" };

const configIdParamSchema = z.uuid().meta({
  description: "The presentation configuration id",
  example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  param: { in: "path", name: "configId" },
});

export const presentationConfigurationPaths = {
  "/passports/{id}/presentation-configurations": {
    get: {
      tags: ["presentation-configurations"],
      summary: "Returns all presentation configurations for the passport",
      parameters: [IdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationListResponseSchema },
          },
        },
      },
      security,
    },
    post: {
      tags: ["presentation-configurations"],
      summary: "Creates a presentation configuration for the passport",
      parameters: [IdParamSchema, orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: PresentationConfigurationCreateRequestSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/passports/{id}/presentation-configurations/{configId}": {
    get: {
      tags: ["presentation-configurations"],
      summary: "Returns a presentation configuration by id for the passport",
      parameters: [IdParamSchema, configIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationDtoSchema },
          },
        },
      },
      security,
    },
    patch: {
      tags: ["presentation-configurations"],
      summary: "Updates a presentation configuration by id for the passport",
      parameters: [IdParamSchema, configIdParamSchema, orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: PresentationConfigurationPatchSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationDtoSchema },
          },
        },
      },
      security,
    },
    delete: {
      tags: ["presentation-configurations"],
      summary: "Deletes a presentation configuration by id for the passport",
      parameters: [IdParamSchema, configIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.NO_CONTENT]: {},
      },
      security,
    },
  },
  "/passports/{id}/presentation-configuration": {
    get: {
      tags: ["presentation-configurations"],
      summary: "Returns the effective presentation configuration for the passport",
      parameters: [IdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/templates/{id}/presentation-configurations": {
    get: {
      tags: ["presentation-configurations"],
      summary: "Returns all presentation configurations for the template",
      parameters: [IdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationListResponseSchema },
          },
        },
      },
      security,
    },
    post: {
      tags: ["presentation-configurations"],
      summary: "Creates a presentation configuration for the template",
      parameters: [IdParamSchema, orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: PresentationConfigurationCreateRequestSchema },
        },
      },
      responses: {
        [HTTPCode.CREATED]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/templates/{id}/presentation-configurations/{configId}": {
    get: {
      tags: ["presentation-configurations"],
      summary: "Returns a presentation configuration by id for the template",
      parameters: [IdParamSchema, configIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationDtoSchema },
          },
        },
      },
      security,
    },
    patch: {
      tags: ["presentation-configurations"],
      summary: "Updates a presentation configuration by id for the template",
      parameters: [IdParamSchema, configIdParamSchema, orgaIdHeader],
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: PresentationConfigurationPatchSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationDtoSchema },
          },
        },
      },
      security,
    },
    delete: {
      tags: ["presentation-configurations"],
      summary: "Deletes a presentation configuration by id for the template",
      parameters: [IdParamSchema, configIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.NO_CONTENT]: {},
      },
      security,
    },
  },
  "/templates/{id}/presentation-configuration": {
    get: {
      tags: ["presentation-configurations"],
      summary: "Returns the effective presentation configuration for the template",
      parameters: [IdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PresentationConfigurationDtoSchema },
          },
        },
      },
      security,
    },
  },
};
