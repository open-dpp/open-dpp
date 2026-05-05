import { type InvitationResponseDto, InvitationStatusDto } from "@open-dpp/dto";
import { randomUUID } from "node:crypto";
import { Factory } from "fishery";

export const invitationsPlainFactory = Factory.define<InvitationResponseDto>(() => ({
  id: randomUUID(),
  status: InvitationStatusDto.PENDING,
  expiresAt: new Date(Date.now()).toISOString(),
  organization: {
    name: "Test Organization",
  },
  inviter: {
    name: "Test User",
  },
  organizationId: randomUUID(),
}));
