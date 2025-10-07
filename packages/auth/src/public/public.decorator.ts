import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC = "isPublic";

export const Public = (...args: string[]) => SetMetadata(IS_PUBLIC, args);
