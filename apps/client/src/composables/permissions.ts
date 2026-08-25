import { type PermissionType } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";

export function usePermissions() {
  const { t } = useI18n();

  const translatePermission = (permission: PermissionType): string => {
    return t(`aasEditor.security.${permission.toLowerCase()}`);
  };

  return {
    translatePermission,
  };
}
