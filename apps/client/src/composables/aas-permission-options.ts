import type { PermissionType } from "@open-dpp/dto";
import type { Subject } from "../lib/aas-security.ts";
import { Permissions } from "@open-dpp/dto";
import { useI18n } from "vue-i18n";
import { isReadOnlySubject } from "../lib/aas-security.ts";

export function useAasPermissionOptions(ignoredPermissionOptions?: PermissionType[]) {
  const { t } = useI18n();

  // The permissions an owner can grant to the subject. Subjects who only read get just Read.
  function getPermissionOptions(subject: Subject) {
    let options: { name: string; key: PermissionType }[] = [
      { name: t("aasEditor.security.read"), key: Permissions.Read },
    ];

    if (!isReadOnlySubject(subject)) {
      options.push(
        { name: t("aasEditor.security.create"), key: Permissions.Create },
        { name: t("aasEditor.security.edit"), key: Permissions.Edit },
        { name: t("aasEditor.security.delete"), key: Permissions.Delete },
      );
    }
    if (ignoredPermissionOptions !== undefined) {
      options = options.filter((permission) => !ignoredPermissionOptions.includes(permission.key));
    }

    return options;
  }

  return { getPermissionOptions };
}
