import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

export const ALLOW_ANONYMOUS = "PUBLIC";
export function AllowAnonymous(): CustomDecorator<string> {
  return SetMetadata(ALLOW_ANONYMOUS, true);
}
