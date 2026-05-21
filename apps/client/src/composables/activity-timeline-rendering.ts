import { useI18n } from "vue-i18n";
import {
  type ActivityDto,
  type JsonPatchOperationDto,
  LanguageTextJsonSchema,
  OperationDtoTypes,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
export function useActivityTimelineRendering() {
  const { t } = useI18n();

  function createTimelineItem(
    activity: ActivityDto,
    change: JsonPatchOperationDto,
    valueFormater: (value: any) => { value: string | undefined; renderValueAsFile?: boolean },
  ) {
    const id = activity.header.id;
    const timestamp = dayjs(activity.header.createdAt).format("LLL");
    const operation = t(`activityHistory.operations.${change.op}`);
    const valueAttr = t("aasEditor.formLabels.value");
    const nameAttr = t("aasEditor.formLabels.name");
    if (change.op === OperationDtoTypes.Remove) {
      return {
        id,
        timestamp,
        attribute: change.path.endsWith("value") ? valueAttr : nameAttr,
        operation,
        value: undefined,
        icon: "pi pi-trash",
      };
    } else if (change.op === OperationDtoTypes.Add) {
      const nameParsingResult = LanguageTextJsonSchema.safeParse(change.value);
      const value = nameParsingResult.success ? nameParsingResult.data.text : change.value;
      return {
        id,
        timestamp,
        attribute: valueAttr,
        operation,
        value,
        icon: "pi pi-plus",
      };
    } else {
      return {
        ...valueFormater(change.value),
        id,
        timestamp,
        attribute: change.path.endsWith("value") ? valueAttr : nameAttr,
        operation,
        icon: "pi pi-user-edit",
      };
    }
  }

  return { createTimelineItem };
}
