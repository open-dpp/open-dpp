import { PermissionEnum, PermissionKindEnum } from "@open-dpp/dto";
import { z } from "zod/v4";

export const PermissionDbSchema = z.object({
  permission: PermissionEnum,
  kindOfPermission: PermissionKindEnum,
});
