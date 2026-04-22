import { BrandingDtoSchema } from "@open-dpp/dto";

const HTTPCode = {
  OK: 200,
} as const;

const ContentType = {
  JSON: "application/json",
  PNG: "image/png",
  JPEG: "image/jpeg",
  WEBP: "image/webp",
  GIF: "image/gif",
  SVG: "image/svg+xml",
} as const;

const tag = "branding";

export const brandingPaths = {
  "/branding": {
    get: {
      tags: [tag],
      summary: "Returns branding configuration for the current organization",
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BrandingDtoSchema },
          },
        },
      },
    },
    put: {
      tags: [tag],
      summary: "Creates or updates branding configuration for the current organization",
      requestBody: {
        content: {
          [ContentType.JSON]: { schema: BrandingDtoSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BrandingDtoSchema },
          },
        },
      },
    },
  },
  "/branding/instance": {
    get: {
      tags: [tag],
      summary: "Returns default instance branding configuration",
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: BrandingDtoSchema },
          },
        },
      },
    },
  },
  "/branding/instance/logo": {
    get: {
      tags: [tag],
      summary: "Returns default instance branding logo image",
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.PNG]: {
              schema: { type: "string", format: "binary" },
            },
            [ContentType.JPEG]: {
              schema: { type: "string", format: "binary" },
            },
            [ContentType.WEBP]: {
              schema: { type: "string", format: "binary" },
            },
            [ContentType.GIF]: {
              schema: { type: "string", format: "binary" },
            },
            [ContentType.SVG]: {
              schema: { type: "string", format: "binary" },
            },
          },
        },
      },
    },
  },
};
