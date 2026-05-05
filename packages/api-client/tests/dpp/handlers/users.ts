import { http, HttpResponse } from "msw";
import { baseURL } from "./index";
import { invitationsPlainFactory } from "@open-dpp/testing";
import { checkQueryParameters } from "../../utils";
import { InvitationStatusDto } from "@open-dpp/dto";

export const userInvitation = invitationsPlainFactory.build();
export const userHandlers = [
  http.get(`${baseURL}/users/me/invitations`, async ({ request }) => {
    const errorResponse = checkQueryParameters(request, {
      status: InvitationStatusDto.PENDING,
    });
    return HttpResponse.json(errorResponse || [userInvitation], { status: 200 });
  }),
];
