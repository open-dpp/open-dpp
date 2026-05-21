import { useI18n } from "vue-i18n";
import {
  type ActivityDto,
  type DataTypeDefType,
  type JsonPatchOperationDto,
  type KeyDto,
  KeyTypes,
  OperationDtoTypes,
  ReferenceJsonSchema,
} from "@open-dpp/dto";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { match, P } from "ts-pattern";
import { formatPropertyValue } from "../lib/property-value.ts";
import { convertLocaleToLanguage } from "../translations/i18n.ts";
import { z } from "zod";

dayjs.extend(utc);

export type TimelineItem = {
  id: string;
  timestamp: string;
  attribute: string;
  operation: string;
  renderValueAsFile?: boolean;
  value: string | undefined;
  icon: string;
};

export function useActivityTimeline() {
  const { t, locale } = useI18n();
  const replaceIcon = "pi pi-user-edit";

  function createTranslations(activity: ActivityDto, change: JsonPatchOperationDto) {
    const id = activity.header.id;
    const timestamp = dayjs(activity.header.createdAt).format("LLL");
    const operation = t(`activityHistory.operations.${change.op}`);
    const valueAttr = t("aasEditor.formLabels.value");
    const nameAttr = t("aasEditor.formLabels.name");
    return { id, timestamp, operation, valueAttr, nameAttr };
  }

  function createSubmodelBaseMatcher(activity: ActivityDto, change: JsonPatchOperationDto) {
    const { id, timestamp, operation, nameAttr } = createTranslations(activity, change);
    return match({ activity, change })
      .returnType<TimelineItem>()
      .with(
        {
          change: {
            op: OperationDtoTypes.Remove,
            path: P.when((path: string) => path.includes("/displayName/")),
          },
        },
        () => ({
          id,
          timestamp,
          attribute: nameAttr,
          operation,
          value: undefined,
          icon: "pi pi-trash",
        }),
      )
      .with(
        {
          change: {
            op: OperationDtoTypes.Add,
            path: P.when((path: string) => path.includes("/displayName/")),
          },
        },
        () => ({
          id,
          timestamp,
          attribute: nameAttr,
          operation,
          value: change.value.text,
          icon: "pi pi-plus",
        }),
      );
  }

  function createTimelineItemForProperty(
    activity: ActivityDto,
    change: JsonPatchOperationDto,
    valueType: DataTypeDefType,
  ): TimelineItem {
    const { id, timestamp, operation, valueAttr } = createTranslations(activity, change);

    const submodelBaseMatcher = createSubmodelBaseMatcher(activity, change);
    return submodelBaseMatcher.otherwise(() => ({
      value: formatPropertyValue(change.value, valueType, convertLocaleToLanguage(locale.value)),
      id,
      timestamp,
      attribute: valueAttr,
      operation,
      icon: replaceIcon,
    }));
  }

  function createTimelineItemForFile(activity: ActivityDto, change: JsonPatchOperationDto) {
    const { id, timestamp, operation, valueAttr } = createTranslations(activity, change);

    const submodelBaseMatcher = createSubmodelBaseMatcher(activity, change);

    return submodelBaseMatcher.otherwise(() => ({
      value: z.string().safeParse(change.value).success ? change.value : undefined,
      renderValueAsFile: true,
      id,
      timestamp,
      attribute: valueAttr,
      operation,
      icon: replaceIcon,
    }));
  }

  function createTimelineItemForReferenceElement(
    activity: ActivityDto,
    change: JsonPatchOperationDto,
  ): TimelineItem | undefined {
    const { id, timestamp, operation, valueAttr } = createTranslations(activity, change);

    const submodelBaseMatcher = createSubmodelBaseMatcher(activity, change);

    function formatValue(value: any) {
      const parsedResult = ReferenceJsonSchema.safeParse(value);
      if (parsedResult.success) {
        return parsedResult.data.keys.find((key: KeyDto) => key.type === KeyTypes.GlobalReference)
          ?.value;
      } else if (z.string().safeParse(value).success) {
        return value;
      }
      return undefined;
    }

    return submodelBaseMatcher.otherwise(() => ({
      value: formatValue(change.value),
      id,
      timestamp,
      attribute: valueAttr,
      operation,
      icon: replaceIcon,
    }));
  }

  return {
    createTimelineItemForProperty,
    createTimelineItemForReferenceElement,
    createTimelineItemForFile,
  };
}
