import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiVersions, ApiVersionsEnum, ApiVersionsType } from "../../api-version";

export const ApiVersion = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiVersionsType => {
    const request = ctx.switchToHttp().getRequest();
    return parseApiVersion(request.path);
  },
);

export function parseApiVersion(path: string): ApiVersionsType {
  const match = path.match(/v(\d+)/);
  const parsingResult = ApiVersionsEnum.safeParse(match ? match[1] : ApiVersions.v1);
  return parsingResult.success ? parsingResult.data : ApiVersions.v1;
}
