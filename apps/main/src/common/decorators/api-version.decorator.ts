import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ApiVersionsDto, ApiVersionsDtoEnum, type ApiVersionsDtoType } from "@open-dpp/dto";

export const ApiVersion = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiVersionsDtoType => {
    const request = ctx.switchToHttp().getRequest();
    return parseApiVersion(request.path);
  },
);

export function parseApiVersion(path: string): ApiVersionsDtoType {
  const match = path.match(/v(\d+)/);
  const parsingResult = ApiVersionsDtoEnum.safeParse(match ? match[1] : ApiVersionsDto.v1);
  return parsingResult.success ? parsingResult.data : ApiVersionsDto.v1;
}
