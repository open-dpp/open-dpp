import type { CustomDecorator } from "@nestjs/common";
import { SetMetadata } from "@nestjs/common";

export const OPTIONAL_AUTH = "OPTIONAL";
export function OptionalAuth(): CustomDecorator<string> {
  return SetMetadata(OPTIONAL_AUTH, true);
}
