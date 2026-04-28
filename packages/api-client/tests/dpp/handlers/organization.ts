import { randomUUID } from "node:crypto";

import { http, HttpResponse } from "msw";
import { baseURL } from "./index";
import { invitationsPlainFactory } from "@open-dpp/testing";

export const organizations = [
  {
    id: randomUUID(),
    name: "orga1",
  },
  { id: randomUUID(), name: "orga2" },
];

export const orgaInvitation = invitationsPlainFactory.build();
export const organizationHandlers = [
  http.get(`${baseURL}/organizations`, () => {
    // ...and respond to them using this JSON response.
    return HttpResponse.json([...organizations]);
  }),
  http.get(`${baseURL}/organizations/invitations/${orgaInvitation.id}`, async () => {
    return HttpResponse.json(orgaInvitation, { status: 200 });
  }),
];
export const activeOrganization = organizations[0];
