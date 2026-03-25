import type { ExecutionContext } from "@nestjs/common";
import { createParamDecorator } from "@nestjs/common";
import { UserRole, UserRoleEnum, UserRoleType } from "../../../users/domain/user-role.enum";

export const UserRoleDecorator: ReturnType<typeof createParamDecorator>
  = createParamDecorator((_data: unknown, context: ExecutionContext): UserRoleType => {
    const request = context.switchToHttp().getRequest();
    return UserRoleEnum.parse(request.user?.role ?? UserRole.ANONYMOUS);
  });
