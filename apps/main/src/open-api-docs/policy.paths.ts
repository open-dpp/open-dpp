import { PolicyUtilizationsDtoSchema, SetPolicyLimitsDtoSchema } from "@open-dpp/dto";
import { z } from "zod";
import { ContentType } from "./content.types";
import { HTTPCode } from "./http.codes";

const tag = "policies";
const security = [{ apiKeyAuth: [] }];
const orgaIdHeader = { $ref: "#/components/parameters/OrganizationIdHeader" };

const organizationIdParamSchema = z.string().meta({
  description: "The organization the policies belong to",
  example: "690cf22459cdae7ce188c1f8",
  param: { in: "path", name: "organizationId" },
});

export const policyPaths = {
  "/policies/organizations/{organizationId}": {
    get: {
      tags: [tag],
      summary: "Returns the limit or policy and current usage of every policy for the organization",
      description:
        "One entry per policy key. Quotas also carry the timestamp at which their counter resets.",
      parameters: [organizationIdParamSchema, orgaIdHeader],
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PolicyUtilizationsDtoSchema },
          },
        },
      },
      security,
    },
  },
  "/policies/organizations/{organizationId}/limits": {
    patch: {
      tags: [tag],
      summary: "Sets the limit of one or more policy keys for an organization",
      description:
        "Only instance admins may call this. Policy keys that are omitted from the body keep their current limit, and at least one key must be given. Responds with the utilization of every policy after the change.",
      parameters: [organizationIdParamSchema, orgaIdHeader],
      requestBody: {
        required: true,
        content: {
          [ContentType.JSON]: { schema: SetPolicyLimitsDtoSchema },
        },
      },
      responses: {
        [HTTPCode.OK]: {
          content: {
            [ContentType.JSON]: { schema: PolicyUtilizationsDtoSchema },
          },
        },
        [HTTPCode.BAD_REQUEST]: {
          description: "The body is empty or holds an unknown policy key or an invalid limit",
        },
        [HTTPCode.FORBIDDEN]: {
          description: "The caller is not an instance admin",
        },
        [HTTPCode.NOT_FOUND]: {
          description: "The organization has no policy stored for one of the given keys",
        },
      },
      security,
    },
  },
};
