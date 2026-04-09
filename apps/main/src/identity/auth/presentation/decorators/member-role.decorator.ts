import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { MemberRoleEnum, MemberRoleType } from "../../../organizations/domain/member-role.enum";

export const MemberRoleDecorator: ReturnType<typeof createParamDecorator>
  = createParamDecorator((_data: unknown, context: ExecutionContext): MemberRoleType | undefined => {
    const request = context.switchToHttp().getRequest();
    return MemberRoleEnum.optional().parse(request.member?.role);
  });
