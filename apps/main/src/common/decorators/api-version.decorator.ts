import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiVersions, ApiVersionsEnum, ApiVersionsType } from "../../api-version";

export const ApiVersion = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiVersionsType => {
    const request = ctx.switchToHttp().getRequest();
    // NestJS VersioningType.URI puts the version in the request object under 'version'
    // when versioning is enabled and a version is matched.
    const path = request.path; // e.g., "/v1/hello"
    const parsingResult = ApiVersionsEnum.safeParse(path.split("/")[1].replace("v", ""));
    return parsingResult.success ? parsingResult.data : ApiVersions.v1;
  },
);
