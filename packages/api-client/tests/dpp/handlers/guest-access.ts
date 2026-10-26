import { randomUUID } from "node:crypto";
import {
  CreateGuestAccessDtoSchema,
  type GuestAccessResponseDto,
  GuestRoleDto,
  UpdateGuestAccessRoleDtoSchema,
} from "@open-dpp/dto";
import { http, HttpResponse } from "msw";
import { baseURL } from "./index";

export const guestAccessOrganizationId = randomUUID();

export const pendingGuestAccess: GuestAccessResponseDto = {
  kind: "Direct",
  id: randomUUID(),
  organizationId: guestAccessOrganizationId,
  email: "repairer@example.com",
  guestRole: GuestRoleDto.REPAIRER,
  grantedBy: randomUUID(),
  status: "Pending",
  createdAt: "2026-10-26T10:00:00.000Z",
};

// Like the backend, the owner endpoints need the organization of the active organization header.
function hasOrganizationHeader(request: Request): boolean {
  return request.headers.get("X-OPEN-DPP-ORGANIZATION-ID") === guestAccessOrganizationId;
}

export const guestAccessHandlers = [
  http.post(`${baseURL}/guest-accesses`, async ({ request }) => {
    if (!hasOrganizationHeader(request)) {
      return new HttpResponse(null, { status: 403 });
    }
    const body = CreateGuestAccessDtoSchema.safeParse(await request.json());
    if (!body.success) {
      return HttpResponse.json(body.error.issues, { status: 400 });
    }
    return HttpResponse.json(
      { ...pendingGuestAccess, email: body.data.email, guestRole: body.data.guestRole },
      { status: 201 },
    );
  }),
  http.get(`${baseURL}/guest-accesses`, ({ request }) => {
    if (!hasOrganizationHeader(request)) {
      return new HttpResponse(null, { status: 403 });
    }
    return HttpResponse.json([pendingGuestAccess]);
  }),
  http.patch(`${baseURL}/guest-accesses/:id/role`, async ({ request, params }) => {
    if (!hasOrganizationHeader(request)) {
      return new HttpResponse(null, { status: 403 });
    }
    const body = UpdateGuestAccessRoleDtoSchema.safeParse(await request.json());
    if (!body.success) {
      return HttpResponse.json(body.error.issues, { status: 400 });
    }
    return HttpResponse.json({
      ...pendingGuestAccess,
      id: params.id,
      guestRole: body.data.guestRole,
    });
  }),
  http.post(`${baseURL}/guest-accesses/:id/revoke`, ({ request, params }) => {
    if (!hasOrganizationHeader(request)) {
      return new HttpResponse(null, { status: 403 });
    }
    return HttpResponse.json(
      {
        ...pendingGuestAccess,
        id: params.id,
        status: "Revoked",
        revokedAt: "2026-10-27T10:00:00.000Z",
      },
      { status: 201 },
    );
  }),
  // The invited person is not a member and sends no organization header.
  http.post(`${baseURL}/guest-accesses/:id/accept`, ({ params }) => {
    return HttpResponse.json(
      {
        ...pendingGuestAccess,
        id: params.id,
        status: "Accepted",
        acceptedByUserId: "user-1",
        acceptedAt: "2026-10-27T10:00:00.000Z",
      },
      { status: 201 },
    );
  }),
];
