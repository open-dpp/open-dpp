import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { DuplicateOrganizationSlugError } from "../domain/organization.errors";

@Catch(DuplicateOrganizationSlugError)
export class OrganizationExceptionFilter implements ExceptionFilter {
  catch(exception: DuplicateOrganizationSlugError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response.status(409).json({
      statusCode: 409,
      message: exception.message,
      error: "Conflict",
    });
  }
}
