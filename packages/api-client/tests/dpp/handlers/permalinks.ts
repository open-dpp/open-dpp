import { randomUUID } from "node:crypto";
import { http, HttpResponse } from "msw";
import {
  CARRIER_EXPORT_CONTENT_TYPES,
  CarrierErrorCorrectionLevel,
  CarrierExportFormat,
  type CarrierExportQueryParams,
  type PassportPermalinkBundleDto,
} from "@open-dpp/dto";
import {
  passportsPlainFactory,
  permalinkCreateRequestPlainFactory,
  permalinkGs1LinkCreateRequestPlainFactory,
  permalinkPublicPlainFactory,
  permalinkUpdateRequestPlainFactory,
} from "@open-dpp/testing";
import { checkQueryParameters } from "../../utils";
import { activeOrganization } from "./organization";
import { baseURL } from "./index";
import { paginationParams } from "./pagination";

export const permalink1 = permalinkPublicPlainFactory.build();
export const permalink2 = permalinkPublicPlainFactory.build({}, { transient: { gs1: true } });

/** An id with a reserved URL character: it only reaches the `:id` routes when it is encoded. */
export const permalinkIdWithSlash = "a/b";

export const openDppCreateRequest = permalinkCreateRequestPlainFactory.build({
  presentationConfigurationId: randomUUID(),
  slug: "my-slug",
});
export const gs1LinkCreateRequest = permalinkGs1LinkCreateRequestPlainFactory.build();

export const permalinkUpdateRequest = permalinkUpdateRequestPlainFactory.build({
  slug: "my-slug",
  baseUrl: null,
});
export const updatedPermalink = { ...permalink1, slug: "my-slug" };

export const permalinkBundle: PassportPermalinkBundleDto = {
  passport: passportsPlainFactory.build({ organizationId: activeOrganization.id }),
  branding: { logo: null, primaryColor: null, permalinkBaseUrl: null },
  presentationConfiguration: null,
  publicUrl: permalink1.publicUrl,
};

export const carrierExportSettings = {
  format: CarrierExportFormat.PNG,
  moduleSize: 0.99,
  dpi: 600,
  errorCorrection: CarrierErrorCorrectionLevel.Q,
} as const satisfies CarrierExportQueryParams;

const carrierSvg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const knownPermalinkIds = [permalink1.id, permalinkIdWithSlash];
const createResponses = [
  { body: openDppCreateRequest, response: permalink1 },
  { body: gs1LinkCreateRequest, response: permalink2 },
];

function isSameJson(received: unknown, expected: unknown) {
  return JSON.stringify(received) === JSON.stringify(expected);
}

function unexpectedBody() {
  return HttpResponse.json({ message: "unexpected body" }, { status: 400 });
}

function unknownPermalink() {
  return HttpResponse.json({ message: "unknown permalink" }, { status: 404 });
}

function hasQuery(request: Request) {
  return new URL(request.url).search !== "";
}

function carrierExportHandler() {
  return http.get(`${baseURL}/permalinks/:id/carrier`, ({ request, params }) => {
    if (!knownPermalinkIds.includes(String(params.id))) {
      return unknownPermalink();
    }
    // Without settings the backend falls back to the defaults, an SVG.
    if (!hasQuery(request)) {
      return new HttpResponse(carrierSvg, {
        headers: { "Content-Type": CARRIER_EXPORT_CONTENT_TYPES.svg },
      });
    }
    const errorResponse = checkQueryParameters(
      request,
      Object.fromEntries(
        Object.entries(carrierExportSettings).map(([key, value]) => [key, String(value)]),
      ),
    );
    return (
      errorResponse ||
      HttpResponse.arrayBuffer(pngSignature.buffer, {
        headers: { "Content-Type": CARRIER_EXPORT_CONTENT_TYPES.png },
      })
    );
  });
}

function backofficeHandlers() {
  const endpoint = `${baseURL}/permalinks`;

  return [
    http.get(endpoint, ({ request }) => {
      if (!hasQuery(request)) {
        return HttpResponse.json(
          { paging_metadata: { cursor: permalink1.id }, result: [permalink1] },
          { status: 200 },
        );
      }
      // The page after the cursor, so a client that drops the params gets the first page.
      const errorResponse = checkQueryParameters(request, {
        limit: paginationParams.limit.toFixed(),
        cursor: paginationParams.cursor,
      });
      return (
        errorResponse ||
        HttpResponse.json(
          { paging_metadata: { cursor: null }, result: [permalink2] },
          { status: 200 },
        )
      );
    }),
    http.post(endpoint, async ({ request }) => {
      const body = await request.json();
      const match = createResponses.find((candidate) => isSameJson(body, candidate.body));
      return match ? HttpResponse.json(match.response, { status: 201 }) : unexpectedBody();
    }),
    http.patch(`${endpoint}/:id`, async ({ request, params }) => {
      if (!knownPermalinkIds.includes(String(params.id))) {
        return unknownPermalink();
      }
      const body = await request.json();
      return isSameJson(body, permalinkUpdateRequest)
        ? HttpResponse.json(updatedPermalink, { status: 200 })
        : unexpectedBody();
    }),
    http.delete(`${endpoint}/:id`, ({ params }) => {
      return knownPermalinkIds.includes(String(params.id))
        ? new HttpResponse(null, { status: 204 })
        : unknownPermalink();
    }),
    carrierExportHandler(),
  ];
}

function resolverHandlers() {
  const endpoint = `${baseURL}/p`;

  return [
    http.get(endpoint, ({ request }) => {
      const errorResponse = checkQueryParameters(request, { passportId: permalink1.passportId });
      return errorResponse || HttpResponse.json([permalink1], { status: 200 });
    }),
    http.get(`${endpoint}/:idOrSlug`, ({ params }) => {
      return params.idOrSlug === permalink1.id
        ? HttpResponse.json(permalinkBundle, { status: 200 })
        : unknownPermalink();
    }),
    http.patch(`${endpoint}/:id`, async ({ request, params }) => {
      if (params.id !== permalink1.id) {
        return unknownPermalink();
      }
      const body = await request.json();
      return isSameJson(body, permalinkUpdateRequest)
        ? HttpResponse.json(updatedPermalink, { status: 200 })
        : unexpectedBody();
    }),
  ];
}

export function permalinksHandlers() {
  return [...backofficeHandlers(), ...resolverHandlers()];
}
