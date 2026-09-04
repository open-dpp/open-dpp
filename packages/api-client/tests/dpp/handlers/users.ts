import { randomUUID } from "node:crypto";
import { http, HttpResponse } from "msw";
import { baseURL } from "./index";
import { invitationsPlainFactory } from "@open-dpp/testing";
import { checkQueryParameters } from "../../utils";
import {
  InvitationStatusDto,
  Language,
  type MeDto,
  RequestEmailChangeDtoSchema,
  UpdateProfileDtoSchema,
} from "@open-dpp/dto";

export const userInvitation = invitationsPlainFactory.build();

export const meResponse: MeDto = {
  user: {
    id: randomUUID(),
    email: "user@example.com",
    firstName: "Test",
    lastName: "User",
    name: "Test User",
    image: null,
    emailVerified: true,
    preferredLanguage: Language.en,
    createdAt: new Date("2026-05-02T10:00:00Z"),
    updatedAt: new Date("2026-05-02T10:00:00Z"),
  },
  pendingEmailChange: null,
};

export const mePendingResponse: MeDto = {
  ...meResponse,
  pendingEmailChange: {
    newEmail: "new@example.com",
    requestedAt: new Date("2026-05-02T11:00:00Z"),
  },
};

function validationError(details: unknown) {
  return HttpResponse.json({ message: "Validation failed", details }, { status: 422 });
}

export const userHandlers = [
  http.get(`${baseURL}/users/me/invitations`, async ({ request }) => {
    const errorResponse = checkQueryParameters(request, {
      status: InvitationStatusDto.PENDING,
    });
    return HttpResponse.json(errorResponse || [userInvitation], { status: 200 });
  }),
  http.get(`${baseURL}/users/me`, async () => {
    return HttpResponse.json(meResponse, { status: 200 });
  }),
  http.patch(`${baseURL}/users/me`, async ({ request }) => {
    const result = UpdateProfileDtoSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.issues);
    }
    return HttpResponse.json(
      { ...meResponse, user: { ...meResponse.user, ...result.data } },
      { status: 200 },
    );
  }),
  http.post(`${baseURL}/users/me/email-change`, async ({ request }) => {
    const result = RequestEmailChangeDtoSchema.safeParse(await request.json());
    if (!result.success) {
      return validationError(result.error.issues);
    }
    return HttpResponse.json(
      {
        ...meResponse,
        pendingEmailChange: { newEmail: result.data.newEmail, requestedAt: new Date() },
      },
      { status: 202 },
    );
  }),
  http.delete(`${baseURL}/users/me/email-change`, async () => {
    return HttpResponse.json(meResponse, { status: 200 });
  }),
  http.post(`${baseURL}/users/email-change/revoke`, async ({ request }) => {
    const body = (await request.json()) as { token?: unknown };
    if (typeof body?.token !== "string" || body.token.length === 0) {
      return HttpResponse.json({ status: "invalid" }, { status: 200 });
    }
    return HttpResponse.json({ status: "ok" }, { status: 200 });
  }),
  http.get(`${baseURL}/users/email-change/revoke/info`, async ({ request }) => {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return HttpResponse.json({ valid: false }, { status: 200 });
    }
    return HttpResponse.json({ valid: true, newEmail: "new@example.com" }, { status: 200 });
  }),
];
