import type { ExecutionContext } from "@nestjs/common";
import { BadRequestException, createParamDecorator } from "@nestjs/common";

export const ORGANIZATION_ID_HEADER = "x-open-dpp-organization-id";

export const OrganizationId: ReturnType<typeof createParamDecorator>
  = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.headers[ORGANIZATION_ID_HEADER];
    if (!organizationId || typeof organizationId !== "string") {
      throw new BadRequestException(
        "X-OPEN-DPP-ORGANIZATION-ID header is required",
      );
    }
    return organizationId;
  });
